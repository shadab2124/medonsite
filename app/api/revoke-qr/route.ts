import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    await prisma.qrToken.updateMany({
      where: {
        attendeeId,
        isActive: true,
      },
      data: {
        isActive: false,
        revokedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Revoke QR error:', error)
    return NextResponse.json(
      { error: 'Failed to revoke QR token' },
      { status: 500 }
    )
  }
}

