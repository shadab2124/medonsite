'use client'

import { FormEvent, useEffect, useState } from 'react'

interface AccountData {
  name: string
  email: string
  role: string
}

export default function AccountSettingsPage() {
  const [account, setAccount] = useState<AccountData | null>(null)
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    async function loadAccount() {
      try {
        const res = await fetch('/api/account', { cache: 'no-store' })
        if (!res.ok) {
          throw new Error('Failed to load account')
        }
        const data = await res.json()
        setAccount(data.user)
        setName(data.user.name)
      } catch (error) {
        console.error(error)
        setStatus({ type: 'error', message: 'Unable to fetch account information at this time.' })
      } finally {
        setInitialized(true)
      }
    }
    loadAccount()
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus(null)

    if (password && password !== passwordConfirm) {
      setStatus({ type: 'error', message: 'Passwords do not match.' })
      return
    }

    if (!name.trim()) {
      setStatus({ type: 'error', message: 'Please provide your name.' })
      return
    }

    try {
      setLoading(true)
      const res = await fetch('/api/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          password: password.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to update account.')
      }

      const data = await res.json()
      setAccount(data.user)
      setStatus({ type: 'success', message: 'Account settings updated successfully.' })
      setPassword('')
      setPasswordConfirm('')
    } catch (error: any) {
      setStatus({ type: 'error', message: error.message || 'Something went wrong.' })
    } finally {
      setLoading(false)
    }
  }

  if (!initialized) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 shadow-sm">
        <p className="text-sm text-slate-500">Loading your account settings…</p>
      </div>
    )
  }

  if (!account) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-10 text-rose-600 shadow-sm">
        We were unable to load your account details. Please refresh and try again.
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">Account Settings</h1>
        <p className="text-sm text-slate-500">
          Update your profile details, manage your password, and review your role within the MedOnsite workspace.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
        >
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700">
              Full name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter your full name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Email address</label>
            <p className="mt-2 rounded-lg border border-slate-100 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-500">
              {account.email}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Role</label>
            <p className="mt-2 inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-600">
              {account.role.replace(/_/g, ' ')}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                New password
                <span className="ml-2 text-xs font-normal text-slate-400">(minimum 8 characters)</span>
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Leave blank to keep current password"
              />
            </div>
            <div>
              <label htmlFor="password-confirm" className="block text-sm font-medium text-slate-700">
                Confirm password
              </label>
              <input
                id="password-confirm"
                type="password"
                value={passwordConfirm}
                onChange={(event) => setPasswordConfirm(event.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Re-enter new password"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            {status && (
              <div
                className={`rounded-xl px-4 py-2 text-sm ${
                  status.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    : 'bg-rose-50 text-rose-600 border border-rose-100'
                }`}
              >
                {status.message}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="ml-auto inline-flex items-center rounded-full bg-indigo-600 px-6 py-2 text-sm font-semibold text-white shadow transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>

        <aside className="space-y-4 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-6 text-sm text-indigo-700 shadow-sm">
          <h2 className="text-base font-semibold text-indigo-800">Security tips</h2>
          <ul className="space-y-3">
            <li>Use a unique password that you do not share with other systems.</li>
            <li>Enable two-factor authentication once your organisation has configured it.</li>
            <li>Review access logs regularly to ensure your account is being used appropriately.</li>
          </ul>
        </aside>
      </div>
    </div>
  )
}

