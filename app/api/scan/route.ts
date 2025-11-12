import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validateQRToken } from '@/lib/qr-token'
import { ScanType, ScanResult } from '@prisma/client'
import { sendMealNotification } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  try {
    const staffUser = await getSessionUser(request)
    if (!staffUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { scannedToken, gateId, scanType } = await request.json()

    if (!scannedToken || !scanType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate token
    const qrToken = await validateQRToken(scannedToken)

    if (!qrToken || !qrToken.attendee) {
      // Unknown token - log as fail and return unknown status
      await prisma.accessLog.create({
        data: {
          tokenId: null,
          scanType: scanType as ScanType,
          gateId: gateId || null,
          staffUserId: staffUser.id,
          result: ScanResult.fail,
          details: {
            reason: 'unknown_token',
            scannedToken: scannedToken.substring(0, 20) + '...',
          },
        },
      })

      return NextResponse.json({
        status: 'unknown',
        message: 'Token not recognized. Please register on-spot.',
        registrationLink: `/kiosk/register?token=${encodeURIComponent(scannedToken)}`,
      })
    }

    const attendee = qrToken.attendee

    if (!attendee.active) {
      await prisma.accessLog.create({
        data: {
          attendeeId: attendee.id,
          tokenId: qrToken.id,
          scanType: scanType as ScanType,
          gateId: gateId || null,
          staffUserId: staffUser.id,
          result: ScanResult.fail,
          details: { reason: 'attendee_inactive' },
        },
      })

      return NextResponse.json({
        status: 'fail',
        message: 'Attendee account is inactive',
      })
    }

    // Handle gate scan
    if (scanType === 'gate') {
      await prisma.accessLog.create({
        data: {
          attendeeId: attendee.id,
          tokenId: qrToken.id,
          scanType: ScanType.gate,
          gateId: gateId || null,
          staffUserId: staffUser.id,
          result: ScanResult.pass,
        },
      })

      return NextResponse.json({
        status: 'pass',
        attendee: {
          id: attendee.id,
          badgeId: attendee.badgeId,
          firstName: attendee.firstName,
          lastName: attendee.lastName,
          org: attendee.org,
          registrationType: attendee.registrationType,
        },
      })
    }

    // Handle cafeteria scan
    if (scanType === 'cafeteria') {
      if (!attendee.eventId) {
        return NextResponse.json({
          status: 'fail',
          message: 'Attendee not associated with an event',
        })
      }

      // Calculate meal usage
      const mealUsage = await prisma.mealUsage.aggregate({
        where: {
          attendeeId: attendee.id,
          eventId: attendee.eventId,
        },
        _sum: {
          count: true,
        },
      })

      const usedMeals = mealUsage._sum.count || 0
      const remaining = attendee.mealAllowance - usedMeals

      if (remaining <= 0) {
        await prisma.accessLog.create({
          data: {
            attendeeId: attendee.id,
            tokenId: qrToken.id,
            scanType: ScanType.cafeteria,
            gateId: gateId || null,
            staffUserId: staffUser.id,
            result: ScanResult.fail,
            details: { reason: 'meal_limit_exceeded', used: usedMeals, allowance: attendee.mealAllowance },
          },
        })

        return NextResponse.json({
          status: 'fail',
          message: 'Meal allowance exhausted',
          used: usedMeals,
          allowance: attendee.mealAllowance,
        })
      }

      // Record meal usage
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const scanLog = await prisma.accessLog.create({
        data: {
          attendeeId: attendee.id,
          tokenId: qrToken.id,
          scanType: ScanType.cafeteria,
          gateId: gateId || null,
          staffUserId: staffUser.id,
          result: ScanResult.pass,
        },
      })

      await prisma.mealUsage.create({
        data: {
          attendeeId: attendee.id,
          eventId: attendee.eventId,
          date: today,
          mealType: 'lunch', // Could be passed in request
          count: 1,
          scanLogId: scanLog.id,
        },
      })

      // Send notification if phone available
      if (attendee.phone) {
        try {
          await sendMealNotification(attendee.phone, 'lunch', remaining - 1)
        } catch (error) {
          console.error('Failed to send meal notification:', error)
        }
      }

      return NextResponse.json({
        status: 'pass',
        attendee: {
          id: attendee.id,
          badgeId: attendee.badgeId,
          firstName: attendee.firstName,
          lastName: attendee.lastName,
        },
        remainingCount: remaining - 1,
        used: usedMeals + 1,
        allowance: attendee.mealAllowance,
      })
    }

    return NextResponse.json(
      { error: 'Invalid scan type' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Scan error:', error)
    return NextResponse.json(
      { error: 'Scan failed', details: error.message },
      { status: 500 }
    )
  }
}

