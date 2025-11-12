'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Attendee {
  id: string
  badgeId: string
  firstName: string
  lastName: string
  email: string | null
  org: string | null
  registrationType: string | null
  mealAllowance: number
  active: boolean
  qrTokens: Array<{ isActive: boolean }>
  _count: { mealUsage: number }
}

export default function AttendeesPage() {
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchAttendees()
  }, [searchQuery])

  const fetchAttendees = async () => {
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set('query', searchQuery)
      const res = await fetch(`/api/attendees?${params}`)
      const data = await res.json()
      setAttendees(data.attendees || [])
    } catch (error) {
      console.error('Failed to fetch attendees:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateQR = async (attendeeId: string) => {
    try {
      const res = await fetch('/api/generate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendeeId }),
      })
      if (res.ok) {
        alert('QR token generated successfully')
        fetchAttendees()
      }
    } catch (error) {
      alert('Failed to generate QR token')
    }
  }

  const handleRevokeQR = async (attendeeId: string) => {
    if (!confirm('Are you sure you want to revoke this QR token?')) return

    try {
      const res = await fetch('/api/revoke-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendeeId }),
      })
      if (res.ok) {
        alert('QR token revoked successfully')
        fetchAttendees()
      }
    } catch (error) {
      alert('Failed to revoke QR token')
    }
  }

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Attendees</h1>
        <Link
          href="/admin/import"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Import Attendees
        </Link>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name, email, or badge ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {attendees.map((attendee) => (
            <li key={attendee.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <p className="text-sm font-medium text-gray-900">
                      {attendee.firstName} {attendee.lastName}
                    </p>
                    {!attendee.active && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Inactive
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <span className="mr-4">Badge: {attendee.badgeId}</span>
                    {attendee.email && <span className="mr-4">{attendee.email}</span>}
                    {attendee.org && <span className="mr-4">{attendee.org}</span>}
                    <span>Meals: {attendee._count.mealUsage}/{attendee.mealAllowance}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {attendee.qrTokens.length > 0 && attendee.qrTokens[0].isActive ? (
                    <button
                      onClick={() => handleRevokeQR(attendee.id)}
                      className="text-red-600 hover:text-red-900 text-sm font-medium"
                    >
                      Revoke QR
                    </button>
                  ) : (
                    <button
                      onClick={() => handleGenerateQR(attendee.id)}
                      className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                    >
                      Generate QR
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {attendees.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No attendees found
        </div>
      )}
    </div>
  )
}

