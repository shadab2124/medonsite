import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getFileUrl } from '@/lib/storage'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const certificate = await prisma.certificate.findUnique({
      where: { id: params.id },
      include: {
        attendee: true,
      },
    })

    if (!certificate) {
      return NextResponse.json(
        { error: 'Certificate not found' },
        { status: 404 }
      )
    }

    // Extract key from URL or use direct URL
    const downloadUrl = certificate.pdfUrl.startsWith('http')
      ? await getFileUrl(certificate.pdfUrl.split('/').pop() || '', 3600)
      : certificate.pdfUrl

    return NextResponse.json({ url: downloadUrl })
  } catch (error: any) {
    console.error('Download certificate error:', error)
    return NextResponse.json(
      { error: 'Failed to get download URL' },
      { status: 500 }
    )
  }
}

