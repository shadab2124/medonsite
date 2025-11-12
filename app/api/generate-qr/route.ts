import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createQRTokenForAttendee } from '@/lib/qr-token'

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
    })

    if (!attendee) {
      return NextResponse.json(
        { error: 'Attendee not found' },
        { status: 404 }
      )
    }

    const token = await createQRTokenForAttendee(attendeeId)

    const qrToken = await prisma.qrToken.findFirst({
      where: {
        attendeeId,
        token,
      },
    })

    return NextResponse.json({
      success: true,
      token,
      qrToken,
    })
  } catch (error: any) {
    console.error('Generate QR error:', error)
    return NextResponse.json(
      { error: 'Failed to generate QR token' },
      { status: 500 }
    )
  }
}

