import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteContext {
  params: {
    id: string
  }
}

const attendeeSelect = {
  id: true,
  badgeId: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  licenseNo: true,
  org: true,
  registrationType: true,
  mealAllowance: true,
  intendedDays: true,
  active: true,
  event: {
    select: {
      id: true,
      name: true,
    },
  },
  qrTokens: {
    orderBy: { issuedAt: 'desc' },
    take: 5,
    select: {
      id: true,
      token: true,
      isActive: true,
      issuedAt: true,
      expiresAt: true,
      revokedAt: true,
      version: true,
    },
  },
  _count: {
    select: {
      mealUsage: true,
    },
  },
} as const

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await getSessionUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const attendee = await prisma.attendee.findUnique({
      where: { id: params.id },
      select: attendeeSelect,
    })

    if (!attendee) {
      return NextResponse.json({ error: 'Attendee not found' }, { status: 404 })
    }

    return NextResponse.json({ attendee })
  } catch (error) {
    console.error('Attendee detail GET error:', error)
    return NextResponse.json({ error: 'Failed to load attendee' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await getSessionUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await request.json()
    const data: any = {}

    if (typeof payload.firstName === 'string' && payload.firstName.trim()) {
      data.firstName = payload.firstName.trim()
    }
    if (typeof payload.lastName === 'string' && payload.lastName.trim()) {
      data.lastName = payload.lastName.trim()
    }
    if (typeof payload.email === 'string') {
      data.email = payload.email.trim() || null
    }
    if (typeof payload.phone === 'string') {
      data.phone = payload.phone.trim() || null
    }
    if (typeof payload.licenseNo === 'string') {
      data.licenseNo = payload.licenseNo.trim() || null
    }
    if (typeof payload.org === 'string') {
      data.org = payload.org.trim() || null
    }
    if (typeof payload.registrationType === 'string') {
      data.registrationType = payload.registrationType.trim() || null
    }
    if (payload.mealAllowance !== undefined) {
      const parsed = Number(payload.mealAllowance)
      if (!Number.isNaN(parsed) && parsed >= 0) {
        data.mealAllowance = Math.floor(parsed)
      }
    }
    if (payload.intendedDays !== undefined) {
      const parsed = Number(payload.intendedDays)
      data.intendedDays = Number.isNaN(parsed) ? null : Math.max(0, Math.floor(parsed))
    }
    if (typeof payload.active === 'boolean') {
      data.active = payload.active
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No attendee updates provided' }, { status: 400 })
    }

    const attendee = await prisma.attendee.update({
      where: { id: params.id },
      data,
      select: attendeeSelect,
    })

    return NextResponse.json({ attendee })
  } catch (error) {
    console.error('Attendee detail PUT error:', error)
    return NextResponse.json({ error: 'Failed to update attendee' }, { status: 500 })
  }
}

