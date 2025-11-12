# Quick Start Guide

Get MedOnsite up and running in 5 minutes.

## Prerequisites

- Node.js 20+ installed
- PostgreSQL 15+ running (or use Docker)

## Steps

### 1. Clone and Install

```bash
git clone <repository-url>
cd Doezy
npm install
```

### 2. Set Up Database

Create a `.env` file:
```bash
cp env.example .env
```

Edit `.env` and set your database URL:
```
DATABASE_URL="postgresql://user:password@localhost:5432/medonsite"
```

### 3. Initialize Database

```bash
# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed with sample data (optional)
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

### 5. Login

Use the default admin credentials (after seeding):
- Email: `admin@medonsite.com`
- Password: `admin123`

## Using Docker (Alternative)

```bash
# Start services
docker-compose up -d

# Run migrations
docker-compose exec app npm run db:migrate

# Seed database
docker-compose exec app npm run db:seed
```

## Next Steps

1. **Import Attendees**: Go to `/admin/import` and upload a CSV file
2. **Generate QR Tokens**: Visit `/admin/attendees` and generate QR tokens
3. **Test Scanning**: Use `/kiosk` to test QR code scanning
4. **View Live Scans**: Check `/admin/scans` for real-time scan logs

## Sample CSV

A sample CSV file is available at `sample-data/sample-attendees.csv`

## Troubleshooting

### Database Connection Error
- Ensure PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Verify database exists: `createdb medonsite`

### Port Already in Use
- Change port: `PORT=3001 npm run dev`
- Or kill process using port 3000

### Prisma Errors
- Run `npm run db:generate` again
- Check database connection
- Verify migrations: `npm run db:migrate`

## Need Help?

Check the main [README.md](README.md) for detailed documentation.

