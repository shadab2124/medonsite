import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { verifyJWT } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AdminDashboard() {
  const token = (await cookies()).get('auth-token')?.value
  const user = token ? verifyJWT(token) : null

  if (!user) {
    redirect('/login')
  }

  const [attendeesCount, activeTokens, todayScans, mealUsage] = await Promise.all([
    prisma.attendee.count({ where: { active: true } }),
    prisma.qrToken.count({ where: { isActive: true } }),
    prisma.accessLog.count({
      where: {
        timestamp: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
    prisma.mealUsage.aggregate({
      _sum: { count: true },
    }),
  ])

  const stats = [
    {
      name: 'Active attendees',
      value: attendeesCount,
      description: 'Currently eligible for scanning',
      color: 'from-indigo-500 via-indigo-500 to-indigo-600',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a7.5 7.5 0 0115 0v.75H4.5v-.75z"
          />
        </svg>
      ),
    },
    {
      name: 'Active QR tokens',
      value: activeTokens,
      description: 'Live and ready for use',
      color: 'from-emerald-500 via-emerald-500 to-emerald-600',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 5.25A2.25 2.25 0 018.25 3h2.5A2.25 2.25 0 0113 5.25v2.5A2.25 2.25 0 0110.75 10h-2.5A2.25 2.25 0 016 7.75v-2.5zM6 16.25A2.25 2.25 0 018.25 14h2.5A2.25 2.25 0 0113 16.25v2.5A2.25 2.25 0 0110.75 21h-2.5A2.25 2.25 0 016 18.75v-2.5zM15 5.25A2.25 2.25 0 0117.25 3h.5A2.25 2.25 0 0120 5.25v.5A2.25 2.25 0 0117.75 8h-.5A2.25 2.25 0 0115 5.75v-.5zM15 14.25A2.25 2.25 0 0117.25 12h.5A2.25 2.25 0 0120 14.25v4.5A2.25 2.25 0 0117.75 21h-.5A2.25 2.25 0 0115 18.75v-4.5z"
          />
        </svg>
      ),
    },
    {
      name: "Today's scans",
      value: todayScans,
      description: 'Successful gate validations',
      color: 'from-sky-500 via-sky-500 to-sky-600',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      name: 'Meals consumed',
      value: mealUsage._sum.count || 0,
      description: 'Across all attended sessions',
      color: 'from-amber-500 via-amber-500 to-amber-600',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v18m8.25-9a8.25 8.25 0 10-16.5 0 8.25 8.25 0 0016.5 0z"
          />
        </svg>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">
          Monitor attendee throughput, QR activity, and meal consumption for your event in real time.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
          >
            <div className={`absolute -right-20 -top-20 h-40 w-40 rounded-full bg-gradient-to-br ${stat.color} opacity-20 transition group-hover:scale-110`} />
            <div className="relative flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900/5 text-slate-700">
                {stat.icon}
              </div>
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Live</span>
            </div>
            <div className="relative mt-6 space-y-3">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">{stat.name}</p>
              <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-sm text-slate-500">{stat.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

