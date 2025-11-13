import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { UserRole } from '@prisma/client'
import { prisma } from './prisma'

export interface AuthUser {
  id: string
  email: string
  role: UserRole
  name: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateJWT(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  )
}

export function verifyJWT(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthUser
    return decoded
  } catch {
    return null
  }
}

export async function getSessionUser(request: NextRequest): Promise<AuthUser | null> {
  try {
    // ✅ Ensure we handle both Edge cookies and regular headers
    let token = null;

    // Try to read from cookies (works for both Edge and Node)
    if (request.cookies?.get('auth-token')) {
      token = request.cookies.get('auth-token')?.value;
    }

    // Fallback to Authorization header (Bearer token)
    if (!token && request.headers.get('authorization')) {
      token = request.headers.get('authorization')?.replace('Bearer ', '');
    }

    if (!token) return null;

    // ✅ Verify token using JWT secret
    const user = verifyJWT(token);
    if (!user) return null;

    // ✅ Verify the user exists and is active in DB
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, role: true, name: true }
    });

    return dbUser;
  } catch (error) {
    console.error('Error in getSessionUser:', error);
    return null;
  }
}

export function requireRole(allowedRoles: UserRole[]) {
  return async (request: NextRequest): Promise<AuthUser | null> => {
    const user = await getSessionUser(request)
    if (!user || !allowedRoles.includes(user.role)) {
      return null
    }
    return user
  }
}

export function createAuthResponse(user: AuthUser): NextResponse {
  const token = generateJWT(user)
  const response = NextResponse.json({ user })
  
  response.cookies.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  })

  return response
}

