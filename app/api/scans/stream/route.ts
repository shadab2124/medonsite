import { NextRequest } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Create a readable stream for Server-Sent Events
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()

      // Send initial connection message
      controller.enqueue(encoder.encode('data: {"type":"connected"}\n\n'))

      // Poll for new scans every 2 seconds
      let lastScanId: string | null = null

      const interval = setInterval(async () => {
        try {
          const recentScans = await prisma.accessLog.findMany({
            take: 10,
            orderBy: { timestamp: 'desc' },
            where: lastScanId
              ? {
                  id: { gt: lastScanId },
                }
              : undefined,
            include: {
              attendee: {
                select: {
                  id: true,
                  badgeId: true,
                  firstName: true,
                  lastName: true,
                },
              },
              staffUser: {
                select: {
                  name: true,
                },
              },
            },
          })

          if (recentScans.length > 0) {
            lastScanId = recentScans[0].id
            for (const scan of recentScans.reverse()) {
              const data = JSON.stringify({
                type: 'scan',
                scan: {
                  id: scan.id,
                  scanType: scan.scanType,
                  result: scan.result,
                  timestamp: scan.timestamp.toISOString(),
                  attendee: scan.attendee,
                  staffUser: scan.staffUser,
                },
              })
              controller.enqueue(encoder.encode(`data: ${data}\n\n`))
            }
          }
        } catch (error) {
          console.error('Stream error:', error)
          clearInterval(interval)
          controller.close()
        }
      }, 2000)

      // Cleanup on client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(interval)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

