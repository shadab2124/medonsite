# MedOnsite

A secure, audited, printable QR-based onsite registration & access system for medical conferences, with ability to import hospital-shared lists, on-spot registration, gate/cafeteria scanning, meal limits, certificate generation, QR revocation and audit logs.

## Features

- **Secure QR Token System**: HMAC-signed tokens with versioning and expiry
- **Multi-Role Authentication**: SUPER_ADMIN, ADMIN, GATE_STAFF, CAFETERIA_STAFF, HOSPITAL_VIEWER
- **Data Import**: CSV upload and Google Sheets OAuth integration
- **On-Spot Registration**: Quick registration kiosk interface
- **Gate & Cafeteria Scanning**: Real-time access control with meal limit enforcement
- **Certificate Generation**: Template-based PDF certificate generation
- **Audit Logs**: Comprehensive logging of all access attempts
- **Badge Printing**: Printable PDF badges with QR codes
- **Notifications**: Email and SMS notifications via SendGrid and Twilio

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Storage**: AWS S3 or Supabase Storage
- **Authentication**: JWT + Session-based
- **PDF Generation**: Puppeteer, PDFKit
- **QR Code**: @zxing/library, qrcode

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Docker & Docker Compose (optional)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Doezy
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env
# Edit .env with your configuration
```

4. Set up the database:
```bash
# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed the database (optional)
npm run db:seed
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Docker Setup

1. Build and start containers:
```bash
docker-compose up -d
```

2. Run migrations:
```bash
docker-compose exec app npm run db:migrate
```

3. Seed the database (optional):
```bash
docker-compose exec app npm run db:seed
```

## Default Credentials

After seeding, you can login with:

- **Super Admin**: `admin@medonsite.com` / `admin123`
- **Gate Staff**: `gate@medonsite.com` / `gate123`
- **Cafeteria Staff**: `cafeteria@medonsite.com` / `cafe123`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout

### Import
- `POST /api/import/csv` - Import attendees from CSV
- `POST /api/import/google-sheet` - Import from Google Sheets

### Attendees
- `GET /api/attendees` - List attendees (with search/filter)
- `POST /api/attendees` - Create attendee (on-spot registration)

### QR Tokens
- `POST /api/generate-qr` - Generate QR token for attendee
- `POST /api/revoke-qr` - Revoke QR token

### Scanning
- `POST /api/scan` - Scan QR token (gate/cafeteria)

### Certificates
- `POST /api/generate-certificate` - Generate certificates
- `GET /api/certificate/:id/download` - Download certificate

## CSV Import Format

The CSV file should contain the following columns:
- `first_name` / `firstName`
- `last_name` / `lastName`
- `email`
- `phone`
- `license_no` / `licenseNo`
- `org` / `organization`
- `registration_type` / `registrationType`
- `meal_allowance` / `mealAllowance`
- `intended_days` / `intendedDays`

## Google Sheets Integration

1. Set up Google OAuth credentials in `.env`
2. Navigate to `/admin/import`
3. Click "Connect Google Sheets"
4. Authenticate and select spreadsheet/range

## Environment Variables

See `env.example` for all required environment variables. Key variables:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT tokens
- `HMAC_SECRET` - Secret for QR token signing
- `SENDGRID_API_KEY` - For email notifications
- `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` - For SMS notifications
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` - For S3 storage

## Project Structure

```
.
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── admin/             # Admin dashboard pages
│   ├── kiosk/             # Kiosk scanning interface
│   └── login/             # Login page
├── lib/                   # Utility libraries
│   ├── auth.ts           # Authentication utilities
│   ├── qr-token.ts       # QR token generation/validation
│   ├── badge-generator.ts # Badge PDF generation
│   └── ...
├── prisma/                # Prisma schema and migrations
└── public/                # Static assets
```

## Testing

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e
```

## Deployment

### Production Build

```bash
npm run build
npm start
```

### Environment Setup

1. Set up PostgreSQL database (Supabase, RDS, etc.)
2. Configure S3 bucket or Supabase Storage
3. Set all environment variables in production
4. Run migrations: `npm run db:migrate`
5. Deploy to Vercel, AWS, or your preferred platform

## Security Considerations

- All QR tokens are HMAC-signed and versioned
- Tokens can be revoked at any time
- All access attempts are logged
- Role-based access control enforced
- JWT tokens expire after 7 days
- Passwords are hashed with bcrypt

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.

