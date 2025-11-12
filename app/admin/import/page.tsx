'use client'

import { useState } from 'react'

export default function ImportPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const handleCSVUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)

    const formData = new FormData(e.currentTarget)
    const file = formData.get('file') as File

    if (!file) {
      setError('Please select a file')
      setLoading(false)
      return
    }

    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)

      const res = await fetch('/api/import/csv', {
        method: 'POST',
        body: uploadFormData,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Import failed')
        return
      }

      setResult(data)
    } catch (err) {
      setError('Failed to upload file')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSheet = async () => {
    // Redirect to Google OAuth
    window.location.href = '/api/auth/google'
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Import Attendees</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">CSV Import</h2>
          <p className="text-sm text-gray-600 mb-4">
            Upload a CSV file with columns: first_name, last_name, email, phone, license_no, org, registration_type, meal_allowance, intended_days
          </p>

          <form onSubmit={handleCSVUpload}>
            <div className="mb-4">
              <input
                type="file"
                name="file"
                accept=".csv"
                required
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Importing...' : 'Import CSV'}
            </button>
          </form>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              <p>Successfully imported {result.imported} attendees</p>
              {result.errors && result.errors.length > 0 && (
                <div className="mt-2">
                  <p className="font-semibold">Errors:</p>
                  <ul className="list-disc list-inside">
                    {result.errors.map((err: any, i: number) => (
                      <li key={i}>Row {err.row}: {err.error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Google Sheets Import</h2>
          <p className="text-sm text-gray-600 mb-4">
            Connect your Google account to import attendees from a Google Sheet. You'll be able to select the spreadsheet and range after authentication.
          </p>

          <button
            onClick={handleGoogleSheet}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
          >
            Connect Google Sheets
          </button>
        </div>
      </div>
    </div>
  )
}

