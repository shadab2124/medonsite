import 'dotenv/config';
import { PrismaClient, UserRole } from '@prisma/client'
import { hashPassword } from '../lib/auth'
import { generateBadgeId } from '../lib/badge-id'
import { createQRTokenForAttendee } from '../lib/qr-token'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create admin user
  const adminPassword = await hashPassword('admin123')
  const admin = await prisma.user.upsert({
    where: { email: 'admin@medonsite.com' },
    update: {},
    create: {
      email: 'admin@medonsite.com',
      name: 'Admin User',
      passwordHash: adminPassword,
      role: UserRole.SUPER_ADMIN,
    },
  })

  console.log('Created admin user:', admin.email)

  // Create gate staff
  const gateStaffPassword = await hashPassword('gate123')
  const gateStaff = await prisma.user.upsert({
    where: { email: 'gate@medonsite.com' },
    update: {},
    create: {
      email: 'gate@medonsite.com',
      name: 'Gate Staff',
      passwordHash: gateStaffPassword,
      role: UserRole.GATE_STAFF,
    },
  })

  console.log('Created gate staff:', gateStaff.email)

  // Create cafeteria staff
  const cafeteriaStaffPassword = await hashPassword('cafe123')
  const cafeteriaStaff = await prisma.user.upsert({
    where: { email: 'cafeteria@medonsite.com' },
    update: {},
    create: {
      email: 'cafeteria@medonsite.com',
      name: 'Cafeteria Staff',
      passwordHash: cafeteriaStaffPassword,
      role: UserRole.CAFETERIA_STAFF,
    },
  })

  console.log('Created cafeteria staff:', cafeteriaStaff.email)

  // Create sample event
  const event = await prisma.event.create({
    data: {
      name: 'Medical Conference 2024',
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-06-03'),
      createdById: admin.id,
    },
  })

  console.log('Created event:', event.name)

  // Create sample attendees
  const sampleAttendees = [
    {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      licenseNo: 'MD12345',
      org: 'City Hospital',
      registrationType: 'Full Conference',
      mealAllowance: 6,
      intendedDays: 3,
    },
    {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      phone: '+1234567891',
      licenseNo: 'MD12346',
      org: 'Regional Medical Center',
      registrationType: 'Full Conference',
      mealAllowance: 6,
      intendedDays: 3,
    },
    {
      firstName: 'Bob',
      lastName: 'Johnson',
      email: 'bob.johnson@example.com',
      phone: '+1234567892',
      licenseNo: 'MD12347',
      org: 'University Hospital',
      registrationType: 'Single Day',
      mealAllowance: 2,
      intendedDays: 1,
    },
  ]

  for (const attendeeData of sampleAttendees) {
    const badgeId = generateBadgeId()
    const attendee = await prisma.attendee.create({
      data: {
        badgeId,
        ...attendeeData,
        source: 'manual',
        eventId: event.id,
        active: true,
      },
    })

    // Generate QR token
    await createQRTokenForAttendee(attendee.id)
    console.log(`Created attendee: ${attendee.firstName} ${attendee.lastName} (${badgeId})`)
  }

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

