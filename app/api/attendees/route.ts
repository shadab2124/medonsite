import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query') || ''
    const registrationType = searchParams.get('registration_type')
    const eventId = searchParams.get('event_id')
    const active = searchParams.get('active')

    const where: any = {}

    if (query) {
      where.OR = [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { badgeId: { contains: query, mode: 'insensitive' } },
      ]
    }

    if (registrationType) {
      where.registrationType = registrationType
    }

    if (eventId) {
      where.eventId = eventId
    }

    if (active !== null) {
      where.active = active === 'true'
    }

    const attendees = await prisma.attendee.findMany({
      where,
      include: {
        event: true,
        qrTokens: {
          where: { isActive: true },
          take: 1,
        },
        _count: {
          select: {
            mealUsage: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({ attendees })
  } catch (error: any) {
    console.error('Get attendees error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attendees' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const { generateBadgeId } = await import('@/lib/badge-id')
    const { createQRTokenForAttendee } = await import('@/lib/qr-token')

    const badgeId = generateBadgeId()
    const attendee = await prisma.attendee.create({
      data: {
        badgeId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || null,
        phone: data.phone || null,
        licenseNo: data.licenseNo || null,
        org: data.org || null,
        registrationType: data.registrationType || null,
        mealAllowance: data.mealAllowance || 0,
        intendedDays: data.intendedDays || null,
        source: 'on_spot',
        eventId: data.eventId || null,
        active: true,
      },
    })

    await createQRTokenForAttendee(attendee.id)

    return NextResponse.json({ attendee })
  } catch (error: any) {
    console.error('Create attendee error:', error)
    return NextResponse.json(
      { error: 'Failed to create attendee', details: error.message },
      { status: 500 }
    )
  }
}

