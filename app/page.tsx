export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { verifyJWT } from '@/lib/auth'

export default async function Home() {
  const token = (await cookies()).get('auth-token')?.value
  const user = token ? verifyJWT(token) : null

  if (user) {
    redirect('/admin')
  } else {
    redirect('/login')
  }
}

