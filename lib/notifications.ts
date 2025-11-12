import sgMail from '@sendgrid/mail'
import * as twilio from 'twilio'

const sendgridApiKey = process.env.SENDGRID_API_KEY
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN
const twilioPhone = process.env.TWILIO_PHONE_NUMBER

if (sendgridApiKey) {
  sgMail.setApiKey(sendgridApiKey)
}

const twilioClient = twilioAccountSid && twilioAuthToken
  ? twilio.default(twilioAccountSid, twilioAuthToken)
  : null

export async function sendEmail(to: string, subject: string, html: string) {
  if (!sendgridApiKey) {
    console.log('[Email] Would send:', { to, subject })
    return
  }

  try {
    await sgMail.send({
      to,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@medonsite.com',
      subject,
      html,
    })
  } catch (error) {
    console.error('Failed to send email:', error)
    throw error
  }
}

export async function sendSMS(to: string, message: string) {
  if (!twilioClient || !twilioPhone) {
    console.log('[SMS] Would send:', { to, message })
    return
  }

  try {
    await twilioClient.messages.create({
      body: message,
      from: twilioPhone,
      to,
    })
  } catch (error) {
    console.error('Failed to send SMS:', error)
    throw error
  }
}

export async function sendBadgeEmail(attendeeEmail: string, badgeUrl: string, attendeeName: string) {
  const html = `
    <h2>Your Conference Badge is Ready</h2>
    <p>Dear ${attendeeName},</p>
    <p>Your badge for the medical conference has been generated. You can download it from the link below:</p>
    <p><a href="${badgeUrl}">Download Badge</a></p>
    <p>Please print this badge and bring it to the conference.</p>
  `
  await sendEmail(attendeeEmail, 'Your Conference Badge', html)
}

export async function sendCertificateEmail(attendeeEmail: string, certificateUrl: string, attendeeName: string) {
  const html = `
    <h2>Your Conference Certificate</h2>
    <p>Dear ${attendeeName},</p>
    <p>Your certificate of attendance has been generated. You can download it from the link below:</p>
    <p><a href="${certificateUrl}">Download Certificate</a></p>
  `
  await sendEmail(attendeeEmail, 'Your Conference Certificate', html)
}

export async function sendMealNotification(attendeePhone: string, mealType: string, remaining: number) {
  const message = `MedOnsite: You used 1 ${mealType} meal. ${remaining} meals remaining.`
  await sendSMS(attendeePhone, message)
}

