'use client'

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import QRCode from 'react-qr-code'

interface AttendeeToken {
  id: string
  token: string
  isActive: boolean
  expiresAt: string
  issuedAt: string
  revokedAt: string | null
  version: number
}

interface AttendeeSummary {
  id: string
  badgeId: string
  firstName: string
  lastName: string
  email: string | null
  org: string | null
  registrationType: string | null
  mealAllowance: number
  active: boolean
  qrTokens: AttendeeToken[]
  _count: { mealUsage: number }
}

interface AttendeeDetail extends AttendeeSummary {
  phone: string | null
  licenseNo: string | null
  intendedDays: number | null
  event: { id: string; name: string | null } | null
}

interface FormState {
  firstName: string
  lastName: string
  email: string
  phone: string
  org: string
  registrationType: string
  mealAllowance: string
  intendedDays: string
  licenseNo: string
  active: boolean
}

type BannerState = { type: 'success' | 'error'; message: string } | null

const emptyForm: FormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  org: '',
  registrationType: '',
  mealAllowance: '0',
  intendedDays: '0',
  licenseNo: '',
  active: true,
}

function formatDate(dateString: string | null | undefined) {
  if (!dateString) return '—'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString()
}

function formatRegistration(registrationType: string | null) {
  if (!registrationType) return '—'
  return registrationType.replace(/_/g, ' ')
}

export default function AttendeesPage() {
  const [attendees, setAttendees] = useState<AttendeeSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [banner, setBanner] = useState<BannerState>(null)

  const [addModalOpen, setAddModalOpen] = useState(false)
  const [addForm, setAddForm] = useState<FormState>(emptyForm)
  const [addSubmitting, setAddSubmitting] = useState(false)

  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [selectedAttendee, setSelectedAttendee] = useState<AttendeeDetail | null>(null)
  const [detailForm, setDetailForm] = useState<FormState>(emptyForm)
  const [detailStatus, setDetailStatus] = useState<BannerState>(null)
  const [savingDetail, setSavingDetail] = useState(false)

  const fetchAttendees = useCallback(async () => {
    const params = new URLSearchParams()
    if (searchQuery) params.set('query', searchQuery)
    try {
      const res = await fetch(`/api/attendees?${params.toString()}`)
      if (!res.ok) {
        throw new Error('Failed to fetch attendees')
      }
      const data = await res.json()
      setAttendees(data.attendees || [])
    } catch (error) {
      console.error(error)
      setBanner({ type: 'error', message: 'Unable to load attendees.' })
    } finally {
      setLoading(false)
    }
  }, [searchQuery])

  useEffect(() => {
    setLoading(true)
    fetchAttendees()
  }, [fetchAttendees])

  useEffect(() => {
    if (!banner) return
    const timer = setTimeout(() => setBanner(null), 5000)
    return () => clearTimeout(timer)
  }, [banner])

  useEffect(() => {
    if (!detailStatus) return
    const timer = setTimeout(() => setDetailStatus(null), 4000)
    return () => clearTimeout(timer)
  }, [detailStatus])

  useEffect(() => {
    if (!selectedAttendee) {
      setDetailForm(emptyForm)
      return
    }
    setDetailForm({
      firstName: selectedAttendee.firstName ?? '',
      lastName: selectedAttendee.lastName ?? '',
      email: selectedAttendee.email ?? '',
      phone: selectedAttendee.phone ?? '',
      org: selectedAttendee.org ?? '',
      registrationType: selectedAttendee.registrationType ?? '',
      mealAllowance: String(selectedAttendee.mealAllowance ?? 0),
      intendedDays: String(selectedAttendee.intendedDays ?? 0),
      licenseNo: selectedAttendee.licenseNo ?? '',
      active: selectedAttendee.active,
    })
  }, [selectedAttendee])

  const handleGenerateQR = async (attendeeId: string) => {
    try {
      const res = await fetch('/api/generate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendeeId }),
      })
      if (!res.ok) {
        throw new Error('Failed to generate QR token')
      }
      setBanner({ type: 'success', message: 'QR token generated successfully.' })
      await fetchAttendees()
      if (selectedAttendee?.id === attendeeId) {
        await openAttendee(attendeeId, true)
      }
    } catch (error) {
      console.error(error)
      setBanner({ type: 'error', message: 'Unable to generate QR token.' })
    }
  }

  const handleRevokeQR = async (attendeeId: string) => {
    if (!window.confirm('Are you sure you want to revoke this QR token?')) return
    try {
      const res = await fetch('/api/revoke-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendeeId }),
      })
      if (!res.ok) {
        throw new Error('Failed to revoke QR token')
      }
      setBanner({ type: 'success', message: 'QR token revoked successfully.' })
      await fetchAttendees()
      if (selectedAttendee?.id === attendeeId) {
        await openAttendee(attendeeId, true)
      }
    } catch (error) {
      console.error(error)
      setBanner({ type: 'error', message: 'Unable to revoke QR token.' })
    }
  }

  const handleAddChange = (field: keyof FormState, value: string | boolean) => {
    setAddForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleDetailChange = (field: keyof FormState, value: string | boolean) => {
    setDetailForm((prev) => ({ ...prev, [field]: value }))
  }

  const submitNewAttendee = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!addForm.firstName.trim() || !addForm.lastName.trim()) {
      setBanner({ type: 'error', message: 'First name and last name are required.' })
      return
    }
    try {
      setAddSubmitting(true)
      const res = await fetch('/api/attendees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: addForm.firstName.trim(),
          lastName: addForm.lastName.trim(),
          email: addForm.email.trim() || null,
          phone: addForm.phone.trim() || null,
          org: addForm.org.trim() || null,
          registrationType: addForm.registrationType.trim() || null,
          mealAllowance: Number(addForm.mealAllowance) || 0,
          intendedDays: Number(addForm.intendedDays) || 0,
          licenseNo: addForm.licenseNo.trim() || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to add attendee.')
      }
      setAddForm(emptyForm)
      setAddModalOpen(false)
      setBanner({ type: 'success', message: 'Attendee added successfully.' })
      await fetchAttendees()
    } catch (error: any) {
      setBanner({ type: 'error', message: error.message || 'Unable to add attendee.' })
    } finally {
      setAddSubmitting(false)
    }
  }

  const openAttendee = async (attendeeId: string, skipLoadingState = false) => {
    try {
      setDetailStatus(null)
      if (!skipLoadingState) {
        setDetailLoading(true)
        setDetailModalOpen(true)
      }
      const res = await fetch(`/api/attendees/${attendeeId}`, { cache: 'no-store' })
      if (!res.ok) {
        throw new Error('Failed to load attendee details')
      }
      const data = await res.json()
      setSelectedAttendee(data.attendee)
      setDetailModalOpen(true)
    } catch (error) {
      console.error(error)
      setDetailStatus({ type: 'error', message: 'Unable to load attendee details.' })
    } finally {
      setDetailLoading(false)
    }
  }

  const submitAttendeeUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedAttendee) return
    if (!detailForm.firstName.trim() || !detailForm.lastName.trim()) {
      setDetailStatus({ type: 'error', message: 'Name fields cannot be empty.' })
      return
    }
    try {
      setSavingDetail(true)
      const res = await fetch(`/api/attendees/${selectedAttendee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: detailForm.firstName.trim(),
          lastName: detailForm.lastName.trim(),
          email: detailForm.email.trim(),
          phone: detailForm.phone.trim(),
          org: detailForm.org.trim(),
          registrationType: detailForm.registrationType.trim(),
          mealAllowance: Number(detailForm.mealAllowance) || 0,
          intendedDays: Number(detailForm.intendedDays) || 0,
          licenseNo: detailForm.licenseNo.trim(),
          active: detailForm.active,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to update attendee.')
      }
      const data = await res.json()
      setSelectedAttendee(data.attendee)
      setDetailStatus({ type: 'success', message: 'Attendee updated successfully.' })
      setAttendees((prev) =>
        prev.map((att) =>
          att.id === data.attendee.id
            ? {
                ...att,
                firstName: data.attendee.firstName,
                lastName: data.attendee.lastName,
                email: data.attendee.email,
                org: data.attendee.org,
                registrationType: data.attendee.registrationType,
                mealAllowance: data.attendee.mealAllowance,
                active: data.attendee.active,
                qrTokens: data.attendee.qrTokens,
                _count: data.attendee._count,
              }
            : att
        )
      )
    } catch (error: any) {
      setDetailStatus({ type: 'error', message: error.message || 'Unable to update attendee.' })
    } finally {
      setSavingDetail(false)
    }
  }

  const activeToken = useMemo(() => {
    if (!selectedAttendee) return null
    return selectedAttendee.qrTokens.find((token) => token.isActive && !token.revokedAt) || null
  }, [selectedAttendee])

  const handlePrintActiveToken = () => {
    if (!selectedAttendee || !activeToken) return
    const svgMarkup = document.getElementById('admin-detail-qr')?.outerHTML ?? ''
    const printWindow = window.open('', 'PRINT', 'height=650,width=480')
    if (!printWindow) return
    const fullName = `${selectedAttendee.firstName} ${selectedAttendee.lastName}`.trim()
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code for ${fullName}</title>
          <style>
            body { font-family: Arial, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .container { text-align: center; }
            h1 { font-size: 20px; margin-bottom: 12px; }
            p { font-size: 14px; color: #5f6b7c; margin: 4px 0; }
            .qr { margin: 16px auto; width: 200px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>${fullName}</h1>
            <div class="qr">${svgMarkup}</div>
            <p>Badge ID: ${selectedAttendee.badgeId}</p>
            <p>Valid until: ${formatDate(activeToken.expiresAt)}</p>
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
    printWindow.close()
  }

  const selectedAttendeeId = selectedAttendee?.id

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Attendees</h1>
          <p className="text-sm text-slate-500">
            Search the roster, manage QR credentials, and keep attendee profiles up to date.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-indigo-700"
          >
            Add attendee
          </button>
          <Link
            href="/admin/import"
            className="inline-flex items-center rounded-full border border-indigo-200 px-5 py-2.5 text-sm font-semibold text-indigo-600 transition hover:border-indigo-300 hover:text-indigo-700"
          >
            Import attendees
          </Link>
        </div>
      </div>

      {banner && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            banner.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-600'
          }`}
        >
          {banner.message}
        </div>
      )}

      <div className="relative">
        <input
          type="text"
          placeholder="Search by name, email, or badge ID..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500">Loading attendees…</div>
        ) : attendees.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">No attendees found.</div>
        ) : (
          <ul className="divide-y divide-slate-200">
            {attendees.map((attendee) => {
              const hasActiveToken =
                attendee.qrTokens.find((token) => token.isActive && !token.revokedAt) !== undefined
              return (
                <li
                  key={attendee.id}
                  className={`cursor-pointer px-6 py-5 transition hover:bg-indigo-50/50 ${
                    selectedAttendeeId === attendee.id ? 'bg-indigo-50/60' : ''
                  }`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-base font-semibold text-slate-900">
                          {attendee.firstName} {attendee.lastName}
                        </p>
                        {!attendee.active && (
                          <span className="inline-flex items-center rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rose-600">
                            Inactive
                          </span>
                        )}
                        {hasActiveToken ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                            QR active
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
                            QR missing
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500">
                        <span>Badge: {attendee.badgeId}</span>
                        {attendee.email && <span>{attendee.email}</span>}
                        {attendee.org && <span>{attendee.org}</span>}
                        <span>
                          Meals:{' '}
                          <strong className="text-slate-700">
                            {attendee._count.mealUsage}/{attendee.mealAllowance}
                          </strong>
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => handleGenerateQR(attendee.id)}
                        className="inline-flex items-center rounded-full border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-600 hover:border-indigo-300 hover:text-indigo-700"
                      >
                        Generate QR
                      </button>
                      <button
                        onClick={() => handleRevokeQR(attendee.id)}
                        className="inline-flex items-center rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:border-rose-300 hover:text-rose-700"
                      >
                        Revoke QR
                      </button>
                      <button
                        onClick={() => openAttendee(attendee.id)}
                        className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800"
                      >
                        View details
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {addModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 px-4 py-6">
          <div className="relative w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Add attendee</h2>
              <button
                onClick={() => {
                  setAddModalOpen(false)
                  setAddForm(emptyForm)
                }}
                className="rounded-full p-2 text-slate-400 hover:text-slate-600"
                aria-label="Close add attendee modal"
              >
                <span className="sr-only">Close</span>
                ×
              </button>
            </div>
            <form onSubmit={submitNewAttendee} className="space-y-6 px-6 py-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-600">First name</label>
                  <input
                    type="text"
                    value={addForm.firstName}
                    onChange={(event) => handleAddChange('firstName', event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600">Last name</label>
                  <input
                    type="text"
                    value={addForm.lastName}
                    onChange={(event) => handleAddChange('lastName', event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600">Email</label>
                  <input
                    type="email"
                    value={addForm.email}
                    onChange={(event) => handleAddChange('email', event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600">Phone</label>
                  <input
                    type="tel"
                    value={addForm.phone}
                    onChange={(event) => handleAddChange('phone', event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600">Organisation</label>
                  <input
                    type="text"
                    value={addForm.org}
                    onChange={(event) => handleAddChange('org', event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600">Registration type</label>
                  <input
                    type="text"
                    value={addForm.registrationType}
                    onChange={(event) => handleAddChange('registrationType', event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600">Meal allowance</label>
                  <input
                    type="number"
                    min={0}
                    value={addForm.mealAllowance}
                    onChange={(event) => handleAddChange('mealAllowance', event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600">Intended days</label>
                  <input
                    type="number"
                    min={0}
                    value={addForm.intendedDays}
                    onChange={(event) => handleAddChange('intendedDays', event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-600">Medical license / ID</label>
                  <input
                    type="text"
                    value={addForm.licenseNo}
                    onChange={(event) => handleAddChange('licenseNo', event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setAddModalOpen(false)
                    setAddForm(emptyForm)
                  }}
                  className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addSubmitting}
                  className="inline-flex items-center rounded-full bg-indigo-600 px-6 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {addSubmitting ? 'Saving…' : 'Save attendee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-6">
          <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {selectedAttendee ? `${selectedAttendee.firstName} ${selectedAttendee.lastName}` : 'Attendee profile'}
                </h2>
                {selectedAttendee && (
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Badge {selectedAttendee.badgeId} · {formatRegistration(selectedAttendee.registrationType)}
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setDetailModalOpen(false)
                  setSelectedAttendee(null)
                }}
                className="rounded-full p-2 text-slate-400 hover:text-slate-600"
                aria-label="Close attendee details"
              >
                <span className="sr-only">Close</span>
                ×
              </button>
            </div>
            {detailLoading && (
              <div className="p-10 text-center text-sm text-slate-500">Loading attendee details…</div>
            )}
            {!detailLoading && selectedAttendee && (
              <div className="grid gap-8 px-6 py-6 lg:grid-cols-[1.7fr,1fr]">
                <form onSubmit={submitAttendeeUpdate} className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-slate-600">First name</label>
                      <input
                        type="text"
                        value={detailForm.firstName}
                        onChange={(event) => handleDetailChange('firstName', event.target.value)}
                        className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600">Last name</label>
                      <input
                        type="text"
                        value={detailForm.lastName}
                        onChange={(event) => handleDetailChange('lastName', event.target.value)}
                        className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600">Email</label>
                      <input
                        type="email"
                        value={detailForm.email}
                        onChange={(event) => handleDetailChange('email', event.target.value)}
                        className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600">Phone</label>
                      <input
                        type="tel"
                        value={detailForm.phone}
                        onChange={(event) => handleDetailChange('phone', event.target.value)}
                        className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600">Organisation</label>
                      <input
                        type="text"
                        value={detailForm.org}
                        onChange={(event) => handleDetailChange('org', event.target.value)}
                        className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600">Registration type</label>
                      <input
                        type="text"
                        value={detailForm.registrationType}
                        onChange={(event) => handleDetailChange('registrationType', event.target.value)}
                        className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600">Meal allowance</label>
                      <input
                        type="number"
                        min={0}
                        value={detailForm.mealAllowance}
                        onChange={(event) => handleDetailChange('mealAllowance', event.target.value)}
                        className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600">Intended days</label>
                      <input
                        type="number"
                        min={0}
                        value={detailForm.intendedDays}
                        onChange={(event) => handleDetailChange('intendedDays', event.target.value)}
                        className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-slate-600">Medical license / ID</label>
                      <input
                        type="text"
                        value={detailForm.licenseNo}
                        onChange={(event) => handleDetailChange('licenseNo', event.target.value)}
                        className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Attendee status</p>
                      <p className="text-xs text-slate-500">Inactive attendees cannot be scanned or use their QR badge.</p>
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
                      <input
                        type="checkbox"
                        checked={detailForm.active}
                        onChange={(event) => handleDetailChange('active', event.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      Active
                    </label>
                  </div>

                  {detailStatus && (
                    <div
                      className={`rounded-xl border px-4 py-3 text-sm ${
                        detailStatus.type === 'success'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-rose-200 bg-rose-50 text-rose-600'
                      }`}
                    >
                      {detailStatus.message}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedAttendee) {
                          openAttendee(selectedAttendee.id, true)
                        }
                      }}
                      className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-700"
                      disabled={savingDetail}
                    >
                      Reset
                    </button>
                    <button
                      type="submit"
                      disabled={savingDetail}
                      className="inline-flex items-center rounded-full bg-indigo-600 px-6 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {savingDetail ? 'Saving…' : 'Save changes'}
                    </button>
                  </div>
                </form>

                <aside className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-6">
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-wide text-slate-500">QR credential</p>
                    {activeToken ? (
                      <>
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                          <QRCode id="admin-detail-qr" value={activeToken.token} size={150} />
                        </div>
                        <p className="text-xs text-slate-500">
                          Version {activeToken.version} · Expires {formatDate(activeToken.expiresAt)}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={handlePrintActiveToken}
                            className="inline-flex items-center rounded-full border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-700"
                          >
                            Print QR
                          </button>
                          <button
                            type="button"
                            onClick={() => navigator.clipboard.writeText(activeToken.token)}
                            className="inline-flex items-center rounded-full border border-indigo-200 px-4 py-1.5 text-xs font-semibold text-indigo-600 hover:border-indigo-300 hover:text-indigo-700"
                          >
                            Copy token
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                        No active QR token. Generate a new token to activate attendee access.
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Recent QR history</p>
                    <div className="mt-3 space-y-2 text-xs text-slate-500">
                      {selectedAttendee.qrTokens.length === 0 && <p>No QR history for this attendee.</p>}
                      {selectedAttendee.qrTokens.map((token) => (
                        <div
                          key={token.id}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2"
                        >
                          <div className="flex items-center justify-between text-slate-700">
                            <span>Version {token.version}</span>
                            <span className={token.isActive && !token.revokedAt ? 'text-emerald-600' : 'text-rose-500'}>
                              {token.isActive && !token.revokedAt ? 'Active' : 'Revoked'}
                            </span>
                          </div>
                          <p className="mt-1 truncate text-[11px]">{token.token}</p>
                          <p className="mt-1 text-[11px]">
                            Issued {formatDate(token.issuedAt)} · Expires {formatDate(token.expiresAt)}
                          </p>
                          {token.revokedAt && (
                            <p className="text-[11px] text-rose-500">Revoked {formatDate(token.revokedAt)}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Event</p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      {selectedAttendee.event?.name ?? 'Not assigned'}
                    </p>
                  </div>
                </aside>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

