import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { verifyJWT } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AdminNav } from '@/components/admin/AdminNav'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const token = (await cookies()).get('auth-token')?.value
  const user = token ? verifyJWT(token) : null

  if (!user) {
    redirect('/login')
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  })

  if (!dbUser) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNav user={dbUser} />
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}

