/**
 * Generate unique badge ID for attendees
 * Format: BADGE-{timestamp}-{random}
 */
export function generateBadgeId(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `BADGE-${timestamp}-${random}`
}

