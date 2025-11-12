# Deployment Guide

This guide covers deploying MedOnsite to production environments.

## Prerequisites

- PostgreSQL database (Supabase, AWS RDS, or self-hosted)
- AWS S3 bucket (or Supabase Storage)
- SendGrid account (for emails)
- Twilio account (for SMS, optional)
- Google Cloud project (for Google Sheets integration, optional)

## Environment Setup

### 1. Database Setup

#### Option A: Supabase
1. Create a new Supabase project
2. Copy the connection string from Settings > Database
3. Update `DATABASE_URL` in your environment variables

#### Option B: AWS RDS
1. Create a PostgreSQL RDS instance
2. Configure security groups to allow connections
3. Set `DATABASE_URL` to: `postgresql://user:password@host:5432/medonsite`

### 2. Storage Setup

#### Option A: AWS S3
1. Create an S3 bucket
2. Configure CORS if needed
3. Create IAM user with S3 access
4. Set environment variables:
   - `STORAGE_TYPE=s3`
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_REGION`
   - `S3_BUCKET_NAME`

#### Option B: Supabase Storage
1. Create a storage bucket in Supabase
2. Set environment variables:
   - `STORAGE_TYPE=supabase`
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `SUPABASE_BUCKET`

### 3. Email Setup (SendGrid)
1. Create SendGrid account
2. Verify sender email
3. Generate API key
4. Set `SENDGRID_API_KEY` and `SENDGRID_FROM_EMAIL`

### 4. SMS Setup (Twilio, Optional)
1. Create Twilio account
2. Get phone number
3. Set environment variables:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_PHONE_NUMBER`

### 5. Google Sheets Integration (Optional)
1. Create Google Cloud project
2. Enable Google Sheets API
3. Create OAuth 2.0 credentials
4. Set redirect URI: `https://yourdomain.com/api/auth/google/callback`
5. Set environment variables:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI`

## Deployment Options

### Vercel (Recommended for Next.js)

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Set environment variables in Vercel dashboard

4. Run migrations:
```bash
vercel env pull .env.local
npx prisma migrate deploy
```

### AWS (Fargate/ECS)

1. Build Docker image:
```bash
docker build -t medonsite .
```

2. Push to ECR:
```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
docker tag medonsite:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/medonsite:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/medonsite:latest
```

3. Create ECS task definition with environment variables
4. Deploy to Fargate

### Docker Compose (Self-hosted)

1. Update `docker-compose.yml` with production environment variables
2. Build and start:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

3. Run migrations:
```bash
docker-compose exec app npm run db:migrate
```

## Post-Deployment Steps

1. **Run Database Migrations**:
```bash
npm run db:migrate
```

2. **Seed Initial Admin User** (if not using seed script):
```bash
# Create admin user manually via Prisma Studio or API
```

3. **Configure Domain**:
   - Update `NEXT_PUBLIC_APP_URL` to your production domain
   - Update Google OAuth redirect URI

4. **Set Up SSL Certificate**:
   - Use Let's Encrypt or your hosting provider's SSL

5. **Configure Backups**:
   - Set up automated database backups
   - Configure S3 bucket versioning

## Security Checklist

- [ ] Change all default secrets (JWT_SECRET, HMAC_SECRET, SESSION_SECRET)
- [ ] Use strong, unique passwords for database
- [ ] Enable HTTPS only
- [ ] Configure CORS properly
- [ ] Set secure cookie flags in production
- [ ] Enable database SSL connections
- [ ] Restrict S3 bucket access
- [ ] Set up rate limiting
- [ ] Enable logging and monitoring
- [ ] Regular security updates

## Monitoring

### Recommended Tools
- **Application Monitoring**: Sentry, Datadog
- **Uptime Monitoring**: UptimeRobot, Pingdom
- **Log Aggregation**: Logtail, Papertrail
- **Database Monitoring**: Supabase dashboard, AWS CloudWatch

### Key Metrics to Monitor
- API response times
- Database connection pool usage
- Error rates
- Scan success/failure rates
- Storage usage
- Email/SMS delivery rates

## Scaling Considerations

1. **Database**: Use connection pooling (PgBouncer recommended)
2. **Caching**: Consider Redis for session storage
3. **CDN**: Use CloudFront/Cloudflare for static assets
4. **Load Balancing**: Use multiple instances behind a load balancer
5. **File Storage**: Ensure S3 bucket is in same region as app

## Troubleshooting

### Database Connection Issues
- Check security groups/firewall rules
- Verify connection string format
- Ensure database is accessible from deployment environment

### Storage Issues
- Verify AWS credentials and permissions
- Check S3 bucket CORS configuration
- Ensure bucket exists and is accessible

### Email/SMS Not Sending
- Verify API keys are correct
- Check SendGrid/Twilio account status
- Review rate limits

## Rollback Procedure

1. Revert to previous deployment
2. Run database migrations if schema changed:
```bash
npx prisma migrate resolve --rolled-back <migration-name>
```
3. Restore database backup if needed

## Support

For deployment issues, check:
- Application logs
- Database logs
- Infrastructure provider status
- Environment variable configuration

