'use client'

import { useState, useEffect } from 'react'

interface Certificate {
  id: string
  certificateId: string
  pdfUrl: string
  generatedAt: string
  attendee: {
    firstName: string
    lastName: string
  }
}

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch certificates - you'll need to create this API endpoint
    setLoading(false)
  }, [])

  const handleDownload = async (certId: string) => {
    try {
      const res = await fetch(`/api/certificate/${certId}/download`)
      const data = await res.json()
      if (data.url) {
        window.open(data.url, '_blank')
      }
    } catch (error) {
      alert('Failed to download certificate')
    }
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Certificates</h1>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {certificates.map((cert) => (
            <li key={cert.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {cert.attendee.firstName} {cert.attendee.lastName}
                  </p>
                  <p className="text-sm text-gray-500">
                    Generated: {new Date(cert.generatedAt).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDownload(cert.id)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Download
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {certificates.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No certificates generated yet
        </div>
      )}
    </div>
  )
}

