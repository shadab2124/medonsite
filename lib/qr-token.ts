import 'dotenv/config';
import crypto from 'crypto';
import { prisma } from './prisma';

// ✅ Use JWT_SECRET if HMAC_SECRET is not defined, with a fallback to ensure no crash
const HMAC_SECRET = process.env.HMAC_SECRET || process.env.JWT_SECRET || 'fallbacksecret';

// ✅ Default expiry days for tokens
const TOKEN_EXPIRY_DAYS = parseInt(process.env.QR_TOKEN_EXPIRY_DAYS || '7');

export interface QRTokenPayload {
  token: string;
}

export interface TokenData {
  attendeeId: string;
  version: number;
  expiresAt: Date;
}

/**
 * Generate HMAC-signed token for QR code
 */
export function generateQRToken(attendeeId: string, version: number, expiresAt: Date): string {
  const payload = `${attendeeId}:${version}:${Math.floor(expiresAt.getTime() / 1000)}`;

  // ✅ Ensure secret is a string, or throw a helpful error
  if (typeof HMAC_SECRET !== 'string' || !HMAC_SECRET.length) {
    throw new Error('HMAC_SECRET or JWT_SECRET is not defined in .env');
  }

  const hmac = crypto.createHmac('sha256', HMAC_SECRET);
  hmac.update(payload);
  const signature = hmac.digest('hex');
  return `${payload}:${signature}`;
}

/**
 * Verify and decode QR token
 */
export function verifyQRToken(token: string): TokenData | null {
  try {
    const parts = token.split(':');
    if (parts.length !== 4) return null;

    const [attendeeId, versionStr, expiryStr, signature] = parts;
    const version = parseInt(versionStr, 10);
    const expiresAt = new Date(parseInt(expiryStr, 10) * 1000);

    // Verify signature
    const payload = `${attendeeId}:${version}:${expiryStr}`;
    const hmac = crypto.createHmac('sha256', HMAC_SECRET);
    hmac.update(payload);
    const expectedSignature = hmac.digest('hex');

    if (signature !== expectedSignature) return null;

    // Check expiry
    if (expiresAt < new Date()) return null;

    return {
      attendeeId,
      version,
      expiresAt,
    };
  } catch {
    return null;
  }
}

/**
 * Create or regenerate QR token for attendee
 */
export async function createQRTokenForAttendee(attendeeId: string): Promise<string> {
  // Revoke existing active tokens
  await prisma.qrToken.updateMany({
    where: { attendeeId, isActive: true },
    data: { isActive: false, revokedAt: new Date() },
  });

  // Get current max version
  const maxToken = await prisma.qrToken.findFirst({
    where: { attendeeId },
    orderBy: { version: 'desc' },
  });

  const newVersion = (maxToken?.version || 0) + 1;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + TOKEN_EXPIRY_DAYS);

  const token = generateQRToken(attendeeId, newVersion, expiresAt);

  await prisma.qrToken.create({
    data: {
      attendeeId,
      token,
      version: newVersion,
      expiresAt,
      isActive: true,
    },
  });

  return token;
}

/**
 * Validate token and get attendee
 */
export async function validateQRToken(token: string) {
  const tokenData = verifyQRToken(token);
  if (!tokenData) return null;

  const qrToken = await prisma.qrToken.findUnique({
    where: { token },
    include: {
      attendee: { include: { event: true } },
    },
  });

  if (!qrToken || !qrToken.isActive || qrToken.revokedAt) return null;
  if (qrToken.expiresAt < new Date()) return null;
  if (qrToken.attendeeId !== tokenData.attendeeId) return null;
  if (qrToken.version !== tokenData.version) return null;

  return qrToken;
}
