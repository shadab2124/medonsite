import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateBadgeId } from '@/lib/badge-id'
import { createQRTokenForAttendee } from '@/lib/qr-token'
import { google } from 'googleapis'
import { RegistrationSource } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['SUPER_ADMIN', 'ADMIN'])(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { spreadsheetId, range, eventId, accessToken } = await request.json()

    if (!spreadsheetId || !range || !accessToken) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )

    oauth2Client.setCredentials({ access_token: accessToken })

    const sheets = google.sheets({ version: 'v4', auth: oauth2Client })

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    })

    const rows = response.data.values
    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'No data found' }, { status: 400 })
    }

    // Assume first row is header
    const headers = rows[0].map((h: string) => h.toLowerCase().replace(/\s+/g, '_'))
    const dataRows = rows.slice(1)

    const attendees = []
    const errors = []

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i]
      try {
        const rowData: any = {}
        headers.forEach((header: string, idx: number) => {
          rowData[header] = row[idx] || ''
        })

        const badgeId = generateBadgeId()
        const attendee = await prisma.attendee.create({
          data: {
            badgeId,
            firstName: rowData.first_name || rowData.firstname || '',
            lastName: rowData.last_name || rowData.lastname || '',
            email: rowData.email || null,
            phone: rowData.phone || null,
            licenseNo: rowData.license_no || rowData.licenseno || null,
            org: rowData.org || rowData.organization || rowData.org_name || null,
            registrationType: rowData.registration_type || rowData.registrationtype || null,
            mealAllowance: parseInt(rowData.meal_allowance || rowData.mealallowance || '0', 10),
            intendedDays: rowData.intended_days ? parseInt(rowData.intended_days, 10) : null,
            source: RegistrationSource.hospital_sheet,
            externalRowId: String(i + 2), // +2 because of header and 0-index
            eventId: eventId || null,
            active: true,
          },
        })

        await createQRTokenForAttendee(attendee.id)
        attendees.push(attendee)
      } catch (error: any) {
        errors.push({ row: i + 2, error: error.message })
      }
    }

    return NextResponse.json({
      success: true,
      imported: attendees.length,
      errors: errors.length > 0 ? errors : undefined,
      attendees,
    })
  } catch (error: any) {
    console.error('Google Sheets import error:', error)
    return NextResponse.json(
      { error: 'Import failed', details: error.message },
      { status: 500 }
    )
  }
}

