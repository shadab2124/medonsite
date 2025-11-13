import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, hashPassword } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({
      user,
    })
  } catch (error) {
    console.error('Account GET error:', error)
    return NextResponse.json({ error: 'Failed to load account' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request)
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, password } = await request.json()
    const data: { name?: string; passwordHash?: string } = {}

    if (typeof name === 'string' && name.trim().length > 1) {
      data.name = name.trim()
    }

    if (typeof password === 'string' && password.trim().length >= 8) {
      data.passwordHash = await hashPassword(password.trim())
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'No valid account updates provided' },
        { status: 400 }
      )
    }

    const updated = await prisma.user.update({
      where: { id: sessionUser.id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    })

    return NextResponse.json({ user: updated })
  } catch (error) {
    console.error('Account PUT error:', error)
    return NextResponse.json({ error: 'Failed to update account' }, { status: 500 })
  }
}

