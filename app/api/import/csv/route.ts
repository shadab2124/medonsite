import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateBadgeId } from '@/lib/badge-id'
import { createQRTokenForAttendee } from '@/lib/qr-token'
import Papa from 'papaparse'
import { RegistrationSource } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['SUPER_ADMIN', 'ADMIN'])(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const eventId = formData.get('eventId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const text = await file.text()
    const result = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
    })

    if (result.errors.length > 0) {
      return NextResponse.json(
        { error: 'CSV parsing error', details: result.errors },
        { status: 400 }
      )
    }

    const attendees = []
    const errors = []

    for (let i = 0; i < result.data.length; i++) {
      const row = result.data[i] as any
      try {
        const badgeId = generateBadgeId()
        const attendee = await prisma.attendee.create({
          data: {
            badgeId,
            firstName: row.first_name || row.firstName || '',
            lastName: row.last_name || row.lastName || '',
            email: row.email || null,
            phone: row.phone || null,
            licenseNo: row.license_no || row.licenseNo || null,
            org: row.org || row.organization || null,
            registrationType: row.registration_type || row.registrationType || null,
            mealAllowance: parseInt(row.meal_allowance || row.mealAllowance || '0', 10),
            intendedDays: row.intended_days ? parseInt(row.intended_days, 10) : null,
            source: RegistrationSource.csv_import,
            externalRowId: String(i + 1),
            eventId: eventId || null,
            active: true,
          },
        })

        // Generate QR token
        await createQRTokenForAttendee(attendee.id)

        attendees.push(attendee)
      } catch (error: any) {
        errors.push({ row: i + 1, error: error.message })
      }
    }

    return NextResponse.json({
      success: true,
      imported: attendees.length,
      errors: errors.length > 0 ? errors : undefined,
      attendees,
    })
  } catch (error: any) {
    console.error('CSV import error:', error)
    return NextResponse.json(
      { error: 'Import failed', details: error.message },
      { status: 500 }
    )
  }
}

