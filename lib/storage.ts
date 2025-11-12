import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const STORAGE_TYPE = process.env.STORAGE_TYPE || 's3'

let s3Client: S3Client | null = null

if (STORAGE_TYPE === 's3') {
  s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  })
}

export async function uploadFile(
  key: string,
  buffer: Buffer,
  contentType: string = 'application/pdf'
): Promise<string> {
  if (STORAGE_TYPE === 's3' && s3Client) {
    const bucket = process.env.S3_BUCKET_NAME!
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    )
    return `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
  }

  // Fallback: local storage (for development)
  const fs = await import('fs/promises')
  const path = await import('path')
  const uploadDir = path.join(process.cwd(), 'uploads')
  await fs.mkdir(uploadDir, { recursive: true })
  const filePath = path.join(uploadDir, key)
  await fs.writeFile(filePath, buffer)
  return `/uploads/${key}`
}

export async function getFileUrl(key: string, expiresIn: number = 3600): Promise<string> {
  // If key is already a full URL, return it
  if (key.startsWith('http://') || key.startsWith('https://')) {
    return key
  }

  if (STORAGE_TYPE === 's3' && s3Client) {
    const bucket = process.env.S3_BUCKET_NAME!
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    })
    return getSignedUrl(s3Client, command, { expiresIn })
  }

  // Fallback: local storage
  return `/uploads/${key}`
}

