import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Constant-time string comparison (pure JS — works in Edge runtime where
 * Node's crypto.timingSafeEqual/Buffer are unavailable).
 */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Creates a Supabase server client bound to the request cookies.
 * Cookie set/remove handlers update the response so refreshed sessions
 * propagate back to the browser.
 */
function createSupabaseClient(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  return { supabase, getResponse: () => response };
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─── API Route Authentication ───────────────────────────────────────────
  if (pathname.startsWith("/api")) {
    // Health check is public for monitoring tools
    if (pathname === "/api/v1/health") {
      return NextResponse.next();
    }

    // Supabase database webhooks — verify webhook secret
    if (pathname.startsWith("/api/v1/webhooks")) {
      const secret = request.headers.get("x-supabase-webhook-secret");
      if (
        secret &&
        process.env.SUPABASE_WEBHOOK_SECRET &&
        safeEqual(secret, process.env.SUPABASE_WEBHOOK_SECRET)
      ) {
        return NextResponse.next();
      }
      return NextResponse.json(
        { success: false, error: "Invalid webhook secret." },
        { status: 401 }
      );
    }

    // Cron jobs — Vercel sends the unspoofable x-vercel-cron header natively.
    // Fall back to x-cron-secret / Authorization: Bearer for other platforms
    // (Railway, Render scheduled jobs).
    if (pathname.startsWith("/api/v1/cron")) {
      const isVercelCron = request.headers.get("x-vercel-cron") !== null;
      const headerSecret = request.headers.get("x-cron-secret");
      const authHeader = request.headers.get("authorization") || "";
      const bearerSecret = authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : "";
      if (
        isVercelCron ||
        (headerSecret &&
          process.env.CRON_SECRET &&
          safeEqual(headerSecret, process.env.CRON_SECRET)) ||
        (bearerSecret &&
          process.env.CRON_SECRET &&
          safeEqual(bearerSecret, process.env.CRON_SECRET))
      ) {
        return NextResponse.next();
      }
      return NextResponse.json(
        { success: false, error: "Invalid cron secret." },
        { status: 401 }
      );
    }

    // Admin API key (external scripts / integrations)
    const apiKey = request.headers.get("x-admin-api-key");
    if (apiKey && process.env.ADMIN_API_KEY && safeEqual(apiKey, process.env.ADMIN_API_KEY)) {
      return NextResponse.next();
    }

    // Fall back to Supabase session (admin UI browser calls)
    const { supabase, getResponse } = createSupabaseClient(request);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      return getResponse();
    }

    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized. Provide x-admin-api-key or a valid session.",
      },
      { status: 401 }
    );
  }

  // ─── UI Session Auth ────────────────────────────────────────────────────
  const { supabase, getResponse } = createSupabaseClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // /auth/callback exchanges the OAuth code for a session — must be reachable
  // without an existing session cookie.
  const isPublicUiRoute =
    pathname.startsWith("/login") || pathname.startsWith("/auth/callback");

  // Protected UI routes redirect to /login when unauthenticated
  if (!user && !isPublicUiRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Logged-in users visiting /login go straight to the dashboard
  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/dashboard";
    return NextResponse.redirect(url);
  }

  return getResponse();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};