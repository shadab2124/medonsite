import QRCode from 'qrcode'
import PDFDocument from 'pdfkit'
import { uploadFile } from './storage'

export interface BadgeData {
  badgeId: string
  firstName: string
  lastName: string
  org?: string | null
  registrationType?: string | null
  photoUrl?: string | null
  qrToken: string
}

export async function generateBadgePDF(data: BadgeData): Promise<string> {
  // Generate QR code image
  const qrCodeDataUrl = await QRCode.toDataURL(data.qrToken, {
    width: 200,
    margin: 1,
  })

  // Convert data URL to buffer
  const qrCodeBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64')

  // Create PDF
  const doc = new PDFDocument({
    size: 'A4',
    margin: 50,
  })

  const buffers: Buffer[] = []
  doc.on('data', buffers.push.bind(buffers))
  doc.on('end', () => {})

  // Badge layout
  const pageWidth = doc.page.width
  const pageHeight = doc.page.height
  const margin = 50
  const badgeWidth = (pageWidth - margin * 3) / 2
  const badgeHeight = (pageHeight - margin * 3) / 2

  // Generate 4 badges per page
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 2; col++) {
      const x = margin + col * (badgeWidth + margin)
      const y = margin + row * (badgeHeight + margin)

      // Badge border
      doc.rect(x, y, badgeWidth, badgeHeight).stroke()

      // QR Code
      doc.image(qrCodeBuffer, x + 20, y + 20, { width: 100, height: 100 })

      // Badge ID
      doc.fontSize(10)
        .text(`ID: ${data.badgeId}`, x + 130, y + 30, { width: badgeWidth - 150 })

      // Name
      doc.fontSize(16)
        .font('Helvetica-Bold')
        .text(`${data.firstName} ${data.lastName}`, x + 130, y + 50, { width: badgeWidth - 150 })

      // Organization
      if (data.org) {
        doc.fontSize(12)
          .font('Helvetica')
          .text(data.org, x + 130, y + 80, { width: badgeWidth - 150 })
      }

      // Registration Type
      if (data.registrationType) {
        doc.fontSize(10)
          .text(data.registrationType, x + 130, y + 100, { width: badgeWidth - 150 })
      }

      // Perforation marks
      const dashLength = 5
      const gapLength = 3
      const dashCount = Math.floor(badgeWidth / (dashLength + gapLength))

      // Top
      for (let i = 0; i < dashCount; i++) {
        const dashX = x + i * (dashLength + gapLength)
        doc.moveTo(dashX, y).lineTo(dashX + dashLength, y).stroke()
      }

      // Bottom
      for (let i = 0; i < dashCount; i++) {
        const dashX = x + i * (dashLength + gapLength)
        doc.moveTo(dashX, y + badgeHeight).lineTo(dashX + dashLength, y + badgeHeight).stroke()
      }

      // Left
      for (let i = 0; i < Math.floor(badgeHeight / (dashLength + gapLength)); i++) {
        const dashY = y + i * (dashLength + gapLength)
        doc.moveTo(x, dashY).lineTo(x, dashY + dashLength).stroke()
      }

      // Right
      for (let i = 0; i < Math.floor(badgeHeight / (dashLength + gapLength)); i++) {
        const dashY = y + i * (dashLength + gapLength)
        doc.moveTo(x + badgeWidth, dashY).lineTo(x + badgeWidth, dashY + dashLength).stroke()
      }
    }
  }

  doc.end()

  // Wait for PDF to finish
  const pdfBuffer = await new Promise<Buffer>((resolve) => {
    doc.on('end', () => {
      resolve(Buffer.concat(buffers))
    })
  })

  // Upload to storage
  const key = `badges/${data.badgeId}.pdf`
  const url = await uploadFile(key, pdfBuffer, 'application/pdf')

  return url
}

