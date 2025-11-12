import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateBadgePDF } from '@/lib/badge-generator'

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['SUPER_ADMIN', 'ADMIN'])(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { attendeeId } = await request.json()

    if (!attendeeId) {
      return NextResponse.json(
        { error: 'Attendee ID is required' },
        { status: 400 }
      )
    }

    const attendee = await prisma.attendee.findUnique({
      where: { id: attendeeId },
      include: {
        qrTokens: {
          where: { isActive: true },
          take: 1,
        },
      },
    })

    if (!attendee) {
      return NextResponse.json(
        { error: 'Attendee not found' },
        { status: 404 }
      )
    }

    const activeToken = attendee.qrTokens[0]
    if (!activeToken) {
      return NextResponse.json(
        { error: 'No active QR token found for attendee' },
        { status: 400 }
      )
    }

    const badgeUrl = await generateBadgePDF({
      badgeId: attendee.badgeId,
      firstName: attendee.firstName,
      lastName: attendee.lastName,
      org: attendee.org,
      registrationType: attendee.registrationType,
      photoUrl: attendee.photoUrl,
      qrToken: activeToken.token,
    })

    return NextResponse.json({
      success: true,
      badgeUrl,
    })
  } catch (error: any) {
    console.error('Generate badge error:', error)
    return NextResponse.json(
      { error: 'Failed to generate badge', details: error.message },
      { status: 500 }
    )
  }
}

