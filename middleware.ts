import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSessionUser } from './lib/auth'

const publicRoutes = ['/', '/login', '/api/auth/login', '/api/auth/google', '/api/auth/google/callback']
const adminRoutes = ['/admin']
const kioskRoutes = ['/kiosk']

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
  const user = await getSessionUser(request)

  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Check admin routes
  if (adminRoutes.some(route => pathname.startsWith(route))) {
    const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'HOSPITAL_VIEWER']
    if (!allowedRoles.includes(user.role)) {
      const url = request.nextUrl.clone()
      url.pathname = '/unauthorized'
      return NextResponse.redirect(url)
    }
  }

  // Check kiosk routes (gate/cafeteria staff)
  if (kioskRoutes.some(route => pathname.startsWith(route))) {
    const allowedRoles = ['GATE_STAFF', 'CAFETERIA_STAFF', 'ADMIN', 'SUPER_ADMIN']
    if (!allowedRoles.includes(user.role)) {
      const url = request.nextUrl.clone()
      url.pathname = '/unauthorized'
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

