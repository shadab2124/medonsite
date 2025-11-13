import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const publicRoutes = ['/', '/login', '/api/auth/login', '/api/auth/google', '/api/auth/google/callback']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (
    publicRoutes.some(route => {
      if (route === '/') {
        return pathname === '/'
      }
      return pathname.startsWith(route)
    })
  ) {
    return NextResponse.next()
  }

  // Check authentication
  const token =
    request.cookies.get('auth-token')?.value ||
    request.headers.get('authorization')?.replace('Bearer ', '') ||
    null

  if (!token) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Role checks are enforced in layouts/pages after full JWT verification

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

