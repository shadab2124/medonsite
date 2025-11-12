import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { verifyJWT } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function ScansPage() {
  const token = (await cookies()).get('auth-token')?.value
  const user = token ? verifyJWT(token) : null

  if (!user) {
    redirect('/login')
  }

  const recentScans = await prisma.accessLog.findMany({
    take: 50,
    orderBy: { timestamp: 'desc' },
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

  return (
    <div className="px-4 py-6 sm:px-0">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Live Scans</h1>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {recentScans.map((scan) => (
            <li key={scan.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      scan.result === 'pass'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {scan.result === 'pass' ? '✓ Pass' : '✗ Fail'}
                    </span>
                    <span className="ml-2 text-sm text-gray-500">
                      {scan.scanType}
                    </span>
                  </div>
                  {scan.attendee && (
                    <div className="mt-1 text-sm text-gray-900">
                      {scan.attendee.firstName} {scan.attendee.lastName} ({scan.attendee.badgeId})
                    </div>
                  )}
                  <div className="mt-1 text-xs text-gray-500">
                    {new Date(scan.timestamp).toLocaleString()} • {scan.staffUser?.name || 'System'}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {recentScans.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No scans yet
        </div>
      )}
    </div>
  )
}

