import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Pass-through for now
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}

