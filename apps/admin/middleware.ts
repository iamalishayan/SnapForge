import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

function bufferToHex(buffer: ArrayBuffer): string {
  const hashArray = Array.from(new Uint8Array(buffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(key)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return bufferToHex(hashBuffer)
}

async function timingSafeEqualEdge(a: string, b: string): Promise<boolean> {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// Initialize Upstash Redis & Rate Limiters
// Redis.fromEnv() automatically picks up UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
const redis = Redis.fromEnv()

const limiters = {
  global: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(100, '1 m'), prefix: 'ratelimit:global' }),
  translate: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, '1 m'), prefix: 'ratelimit:translate' }),
  qa: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, '1 m'), prefix: 'ratelimit:qa' }),
}

// Map of route prefixes to required scopes
const ROUTE_SCOPES: Record<string, string[]> = {
  '/api/v1/articles': ['read', 'write', 'admin'],
  '/api/v1/translate': ['write', 'admin'],
  '/api/v1/qa': ['write', 'admin'],
}

// Special case for POST/DELETE which might need higher scopes than GET
function getRequiredScope(pathname: string, method: string): string[] {
  // If it's a mutation on articles, require write or admin
  if (pathname.startsWith('/api/v1/articles') && method !== 'GET') {
    return ['write', 'admin']
  }
  
  for (const [route, scopes] of Object.entries(ROUTE_SCOPES)) {
    if (pathname.startsWith(route)) {
      return scopes
    }
  }
  return ['admin'] // Default to admin for any unknown /api route
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Apply Rate Limiting
  let ratelimitResult
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'anonymous'
  
  if (pathname.startsWith('/api/v1/translate')) {
    ratelimitResult = await limiters.translate.limit(ip)
  } else if (pathname.startsWith('/api/v1/qa')) {
    ratelimitResult = await limiters.qa.limit(ip)
  } else if (pathname.startsWith('/api')) {
    ratelimitResult = await limiters.global.limit(ip)
  }

  if (ratelimitResult && !ratelimitResult.success) {
    return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, {
      status: 429,
      headers: {
        'Retry-After': ratelimitResult.reset.toString(),
        'X-RateLimit-Limit': ratelimitResult.limit.toString(),
        'X-RateLimit-Remaining': ratelimitResult.remaining.toString(),
        'X-RateLimit-Reset': ratelimitResult.reset.toString(),
      }
    })
  }

  // 1. Webhook protection
  if (pathname.startsWith('/api/v1/webhooks')) {
    const webhookSecret = request.headers.get('x-supabase-webhook-secret') || request.headers.get('authorization')?.replace('Bearer ', '')
    const validSecret = process.env.SUPABASE_WEBHOOK_SECRET
    
    if (!validSecret || !webhookSecret || !(await timingSafeEqualEdge(webhookSecret, validSecret))) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Invalid Webhook Secret.' }, { status: 401 })
    }
    return NextResponse.next()
  }

  // 1.5. Health Check (Public)
  if (pathname === '/api/v1/health') {
    return NextResponse.next()
  }


  // 2. Cron protection
  if (pathname.startsWith('/api/v1/cron')) {
    const authHeader = request.headers.get('authorization')
    const validSecret = process.env.CRON_SECRET
    
    if (!validSecret || !authHeader || !(await timingSafeEqualEdge(authHeader, `Bearer ${validSecret}`))) {
      return NextResponse.json({ success: false, error: 'Unauthorized cron request.' }, { status: 401 })
    }
    return NextResponse.next()
  }

  // 3. Admin API RBAC via Supabase
  if (pathname.startsWith('/api')) {
    const rawKey = request.headers.get('x-admin-api-key') || request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!rawKey) {
      return NextResponse.json({ success: false, error: 'Unauthorized. API Key required.' }, { status: 401 })
    }

    // Hash the incoming key
    const hashedKey = await hashApiKey(rawKey)

    // Lookup the key in Supabase (using REST API since we are in Edge runtime)
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/api_keys?select=scope,active&key_hash=eq.${hashedKey}`, {
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY!}`
        }
      })
      
      const keys = await res.json()
      
      if (!res.ok || !keys || keys.length === 0) {
        return NextResponse.json({ success: false, error: 'Unauthorized. Invalid API Key.' }, { status: 401 })
      }

      const keyRecord = keys[0]
      if (!keyRecord.active) {
        return NextResponse.json({ success: false, error: 'Unauthorized. API Key is inactive.' }, { status: 401 })
      }

      // Check if the key's scope satisfies the route requirements
      const requiredScopes = getRequiredScope(pathname, request.method)
      if (!requiredScopes.includes(keyRecord.scope) && keyRecord.scope !== 'admin') {
         return NextResponse.json({ success: false, error: `Forbidden. Requires one of scopes: ${requiredScopes.join(', ')}` }, { status: 403 })
      }

      // Key is valid and scope is sufficient
      return NextResponse.next()

    } catch (error) {
      console.error('[Middleware] API Key DB lookup failed:', error)
      return NextResponse.json({ success: false, error: 'Internal Server Error during auth.' }, { status: 500 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*', '/admin/:path*'],
}
