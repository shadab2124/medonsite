import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadFile } from '@/lib/storage'
import { sendCertificateEmail } from '@/lib/notifications'
import puppeteer from 'puppeteer'
import Handlebars from 'handlebars'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['SUPER_ADMIN', 'ADMIN'])(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { eventId, attendeeIds } = await request.json()

    if (!eventId || !attendeeIds || !Array.isArray(attendeeIds)) {
      return NextResponse.json(
        { error: 'Event ID and attendee IDs are required' },
        { status: 400 }
      )
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        certTemplate: true,
      },
    })

    if (!event || !event.certTemplate) {
      return NextResponse.json(
        { error: 'Event or certificate template not found' },
        { status: 404 }
      )
    }

    const attendees = await prisma.attendee.findMany({
      where: {
        id: { in: attendeeIds },
        eventId,
      },
    })

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const template = Handlebars.compile(event.certTemplate.htmlTemplate)
    const certificates = []

    for (const attendee of attendees) {
      try {
        const certificateId = uuidv4()
        const daysAttended = await (prisma.accessLog.count as any)({
          where: {
            attendeeId: attendee.id,
            scanType: 'gate',
            result: 'pass',
          },
          distinct: ['timestamp'],
        })

        const html = template({
          first_name: attendee.firstName,
          last_name: attendee.lastName,
          event_name: event.name,
          days_attended: daysAttended,
          certificate_id: certificateId,
        })

        const page = await browser.newPage()
        await page.setContent(html, { waitUntil: 'networkidle0' })
        const pdf = await page.pdf({
          format: 'A4',
          printBackground: true,
        })
        await page.close()

        const key = `certificates/${eventId}/${attendee.id}/${certificateId}.pdf`
        const pdfUrl = await uploadFile(key, Buffer.from(pdf), 'application/pdf')

        const certificate = await prisma.certificate.create({
          data: {
            attendeeId: attendee.id,
            eventId,
            pdfUrl,
            certificateId,
          },
        })

        certificates.push(certificate)

        // Send email if available
        if (attendee.email) {
          try {
            await sendCertificateEmail(attendee.email, pdfUrl, `${attendee.firstName} ${attendee.lastName}`)
          } catch (error) {
            console.error('Failed to send certificate email:', error)
          }
        }
      } catch (error: any) {
        console.error(`Failed to generate certificate for ${attendee.id}:`, error)
      }
    }

    await browser.close()

    return NextResponse.json({
      success: true,
      generated: certificates.length,
      certificates,
    })
  } catch (error: any) {
    console.error('Generate certificate error:', error)
    return NextResponse.json(
      { error: 'Failed to generate certificates', details: error.message },
      { status: 500 }
    )
  }
}

