# MedOnsite - Project Summary

## Overview

MedOnsite is a production-ready, secure QR-based registration and access system for medical conferences. It provides comprehensive features for attendee management, access control, meal tracking, and certificate generation.

## ✅ Completed Features

### 1. Core Infrastructure
- ✅ Next.js 14 with App Router
- ✅ TypeScript throughout
- ✅ Tailwind CSS for styling
- ✅ Prisma ORM with PostgreSQL
- ✅ Docker & Docker Compose setup
- ✅ Environment configuration

### 2. Authentication & Authorization
- ✅ JWT + Session-based authentication
- ✅ Role-based access control (5 roles)
- ✅ Protected routes with middleware
- ✅ Login/logout functionality

### 3. Database Schema
- ✅ Complete Prisma schema with all models:
  - Users (with roles)
  - Attendees
  - QR Tokens (with versioning)
  - Access Logs
  - Meal Usage
  - Certificates
  - Events
  - Certificate Templates

### 4. QR Token System
- ✅ HMAC-signed tokens
- ✅ Token versioning
- ✅ Expiry management
- ✅ Revocation capability
- ✅ Secure validation

### 5. Data Import
- ✅ CSV file upload
- ✅ Google Sheets OAuth integration
- ✅ Flexible column mapping
- ✅ Error handling and reporting

### 6. Scanning System
- ✅ Gate scanning API
- ✅ Cafeteria scanning with meal limits
- ✅ Real-time validation
- ✅ Unknown token handling
- ✅ Comprehensive logging

### 7. On-Spot Registration
- ✅ Kiosk registration UI
- ✅ Quick attendee creation
- ✅ Automatic QR generation
- ✅ Camera-based QR scanning

### 8. Badge Generation
- ✅ PDF badge generation
- ✅ QR code embedding
- ✅ Printable A4 layout (4 badges per page)
- ✅ Perforation marks
- ✅ Attendee information display

### 9. Certificate System
- ✅ Template-based generation
- ✅ Handlebars variable support
- ✅ Puppeteer PDF generation
- ✅ Bulk generation
- ✅ Email delivery

### 10. Admin Dashboard
- ✅ Dashboard with statistics
- ✅ Attendee management
- ✅ Import interface
- ✅ Live scan feed
- ✅ Certificate management
- ✅ QR token management

### 11. Notifications
- ✅ SendGrid email integration
- ✅ Twilio SMS integration
- ✅ Badge delivery emails
- ✅ Certificate delivery emails
- ✅ Meal usage notifications

### 12. Real-time Updates
- ✅ Server-Sent Events (SSE) for live scans
- ✅ Real-time dashboard updates

### 13. Storage
- ✅ AWS S3 integration
- ✅ Local storage fallback
- ✅ File upload/download

### 14. Testing
- ✅ Jest configuration
- ✅ Unit tests for QR tokens
- ✅ Test utilities setup

### 15. Documentation
- ✅ Comprehensive README
- ✅ Quick Start Guide
- ✅ Deployment Guide
- ✅ Contributing Guide
- ✅ Sample data files

## Project Structure

```
Doezy/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── auth/         # Authentication
│   │   ├── import/       # Data import
│   │   ├── attendees/    # Attendee management
│   │   ├── scan/         # QR scanning
│   │   └── certificate/  # Certificates
│   ├── admin/            # Admin dashboard
│   ├── kiosk/            # Kiosk interface
│   └── login/            # Login page
├── lib/                   # Utility libraries
│   ├── auth.ts           # Authentication
│   ├── qr-token.ts       # QR token logic
│   ├── badge-generator.ts # Badge PDF
│   ├── storage.ts        # File storage
│   └── notifications.ts  # Email/SMS
├── prisma/                # Database
│   ├── schema.prisma     # Schema definition
│   └── seed.ts           # Seed script
├── tests/                # Test files
├── sample-data/          # Sample CSV
├── Dockerfile            # Docker config
├── docker-compose.yml    # Docker Compose
└── Documentation files
```

## Key API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/google` - Google OAuth
- `GET /api/auth/google/callback` - OAuth callback

### Import
- `POST /api/import/csv` - CSV import
- `POST /api/import/google-sheet` - Google Sheets import

### Attendees
- `GET /api/attendees` - List/search attendees
- `POST /api/attendees` - Create attendee

### QR Tokens
- `POST /api/generate-qr` - Generate QR token
- `POST /api/revoke-qr` - Revoke QR token
- `POST /api/generate-badge` - Generate badge PDF

### Scanning
- `POST /api/scan` - Scan QR code
- `GET /api/scans/stream` - Live scan feed (SSE)

### Certificates
- `POST /api/generate-certificate` - Generate certificates
- `GET /api/certificate/:id/download` - Download certificate

## Security Features

1. **HMAC-signed QR tokens** - Prevents token tampering
2. **Token versioning** - Allows revocation
3. **JWT authentication** - Secure session management
4. **Role-based access** - Granular permissions
5. **Audit logging** - All actions logged
6. **Password hashing** - bcrypt encryption

## Default Credentials (After Seeding)

- **Super Admin**: admin@medonsite.com / admin123
- **Gate Staff**: gate@medonsite.com / gate123
- **Cafeteria Staff**: cafeteria@medonsite.com / cafe123

## Environment Variables

See `env.example` for complete list. Key variables:
- `DATABASE_URL` - PostgreSQL connection
- `JWT_SECRET` - JWT signing secret
- `HMAC_SECRET` - QR token signing secret
- `SENDGRID_API_KEY` - Email service
- `TWILIO_*` - SMS service
- `AWS_*` - S3 storage
- `GOOGLE_*` - Google Sheets OAuth

## Deployment Options

1. **Vercel** (Recommended) - Easy Next.js deployment
2. **AWS Fargate/ECS** - Container-based
3. **Docker Compose** - Self-hosted
4. **Any Node.js hosting** - Standard deployment

## Next Steps for Production

1. Set up production database (Supabase/RDS)
2. Configure S3 bucket or Supabase Storage
3. Set up SendGrid account
4. Configure Twilio (optional)
5. Set up Google OAuth (optional)
6. Change all default secrets
7. Configure domain and SSL
8. Set up monitoring and backups
9. Run database migrations
10. Deploy!

## Testing

```bash
# Unit tests
npm test

# E2E tests (when configured)
npm run test:e2e
```

## Support & Documentation

- **README.md** - Main documentation
- **QUICKSTART.md** - Quick setup guide
- **DEPLOYMENT.md** - Production deployment
- **CONTRIBUTING.md** - Contribution guidelines

## Technology Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: PostgreSQL, Prisma ORM
- **Storage**: AWS S3 / Supabase Storage
- **Email**: SendGrid
- **SMS**: Twilio
- **PDF**: Puppeteer, PDFKit
- **QR Codes**: @zxing/library, qrcode
- **Auth**: JWT, bcrypt
- **OAuth**: Google APIs

## License

MIT

---

**Status**: ✅ Production-ready MVP
**Last Updated**: 2024
**Version**: 1.0.0

