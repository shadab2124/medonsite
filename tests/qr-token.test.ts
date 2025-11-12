import { generateQRToken, verifyQRToken } from '../lib/qr-token'

describe('QR Token Generation and Verification', () => {
  const attendeeId = 'test-attendee-id'
  const version = 1
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now

  it('should generate a valid token', () => {
    const token = generateQRToken(attendeeId, version, expiresAt)
    expect(token).toBeDefined()
    expect(token.split(':')).toHaveLength(4)
  })

  it('should verify a valid token', () => {
    const token = generateQRToken(attendeeId, version, expiresAt)
    const decoded = verifyQRToken(token)
    
    expect(decoded).not.toBeNull()
    expect(decoded?.attendeeId).toBe(attendeeId)
    expect(decoded?.version).toBe(version)
  })

  it('should reject an invalid token', () => {
    const invalidToken = 'invalid:token:format'
    const decoded = verifyQRToken(invalidToken)
    expect(decoded).toBeNull()
  })

  it('should reject a token with invalid signature', () => {
    const token = generateQRToken(attendeeId, version, expiresAt)
    const parts = token.split(':')
    parts[3] = 'invalid-signature'
    const modifiedToken = parts.join(':')
    
    const decoded = verifyQRToken(modifiedToken)
    expect(decoded).toBeNull()
  })

  it('should reject an expired token', () => {
    const pastDate = new Date(Date.now() - 1000) // 1 second ago
    const token = generateQRToken(attendeeId, version, pastDate)
    const decoded = verifyQRToken(token)
    
    // The token should be rejected because it's expired
    expect(decoded).toBeNull()
  })
})

