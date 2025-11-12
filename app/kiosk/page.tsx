'use client'

import { useState, useRef, useEffect } from 'react'
import { BrowserMultiFormatReader } from '@zxing/library'

export default function KioskPage() {
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const codeReader = useRef<BrowserMultiFormatReader | null>(null)

  useEffect(() => {
    codeReader.current = new BrowserMultiFormatReader()
    return () => {
      if (codeReader.current) {
        codeReader.current.reset()
      }
    }
  }, [])

  const startScanning = async () => {
    if (!codeReader.current || !videoRef.current) return

    setScanning(true)
    setError('')
    setResult(null)

    try {
      const result = await codeReader.current.decodeFromVideoDevice(
        null,
        videoRef.current,
        (result, error) => {
          if (result) {
            handleScan(result.getText())
          }
          if (error && error.name !== 'NotFoundException') {
            console.error('Scan error:', error)
          }
        }
      )
    } catch (err: any) {
      setError('Failed to access camera: ' + err.message)
      setScanning(false)
    }
  }

  const stopScanning = () => {
    if (codeReader.current) {
      codeReader.current.reset()
    }
    setScanning(false)
  }

  const handleScan = async (token: string) => {
    stopScanning()

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scannedToken: token,
          scanType: 'gate',
        }),
      })

      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError('Failed to process scan')
    }
  }

  const handleManualEntry = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const token = formData.get('token') as string
    if (token) {
      await handleScan(token)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Gate Scanner</h1>

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="mb-4">
            <button
              onClick={scanning ? stopScanning : startScanning}
              className={`w-full py-4 px-6 rounded-lg font-semibold text-lg ${
                scanning
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {scanning ? 'Stop Scanning' : 'Start Camera Scanner'}
            </button>
          </div>

          <video
            ref={videoRef}
            className={`w-full rounded-lg ${scanning ? 'block' : 'hidden'}`}
            style={{ maxHeight: '400px' }}
          />

          <form onSubmit={handleManualEntry} className="mt-4">
            <label className="block text-sm font-medium mb-2">
              Or enter token manually:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                name="token"
                className="flex-1 px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
                placeholder="Enter QR token..."
              />
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
              >
                Scan
              </button>
            </div>
          </form>
        </div>

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {result && (
          <div className={`bg-gray-800 rounded-lg p-6 ${
            result.status === 'pass' ? 'border-2 border-green-500' :
            result.status === 'fail' ? 'border-2 border-red-500' :
            'border-2 border-yellow-500'
          }`}>
            <h2 className="text-2xl font-bold mb-4">
              {result.status === 'pass' && '✓ Access Granted'}
              {result.status === 'fail' && '✗ Access Denied'}
              {result.status === 'unknown' && '? Unknown Token'}
            </h2>

            {result.status === 'pass' && result.attendee && (
              <div className="space-y-2">
                <p><strong>Name:</strong> {result.attendee.firstName} {result.attendee.lastName}</p>
                <p><strong>Badge ID:</strong> {result.attendee.badgeId}</p>
                {result.attendee.org && <p><strong>Organization:</strong> {result.attendee.org}</p>}
              </div>
            )}

            {result.status === 'unknown' && (
              <div>
                <p className="mb-4">{result.message}</p>
                {result.registrationLink && (
                  <a
                    href={result.registrationLink}
                    className="inline-block bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-semibold"
                  >
                    Register On-Spot
                  </a>
                )}
              </div>
            )}

            {result.message && result.status !== 'pass' && (
              <p className="mt-4 text-gray-300">{result.message}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

