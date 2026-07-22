import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Protect webhook routes with a dedicated Supabase webhook secret
  if (request.nextUrl.pathname.startsWith('/api/webhooks')) {
    const webhookSecret = request.headers.get('x-supabase-webhook-secret') || request.headers.get('authorization')?.replace('Bearer ', '')
    const validSecret = process.env.SUPABASE_WEBHOOK_SECRET

    if (!validSecret || webhookSecret !== validSecret) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Invalid or missing Webhook Secret.' }, { status: 401 })
    }
    return NextResponse.next()
  }

  // Protect all other /api routes in the admin app with the standard admin key
  if (request.nextUrl.pathname.startsWith('/api')) {
    const apiKey = request.headers.get('x-admin-api-key') || request.headers.get('authorization')?.replace('Bearer ', '')
    const validKey = process.env.ADMIN_API_KEY

    // If the server doesn't have a key configured, or the request key is wrong, reject.
    if (!validKey || apiKey !== validKey) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Invalid or missing API key.' }, { status: 401 })
    }
  }

  return NextResponse.next()
}

export const config = {
  // Match all API routes and admin frontend routes
  matcher: ['/api/:path*', '/admin/:path*'],
}
