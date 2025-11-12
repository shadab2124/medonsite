# Contributing to MedOnsite

Thank you for your interest in contributing to MedOnsite!

## Development Setup

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (copy `env.example` to `.env`)
4. Set up database: `npm run db:migrate`
5. Seed database (optional): `npm run db:seed`
6. Start dev server: `npm run dev`

## Code Style

- Use TypeScript for all new code
- Follow existing code patterns
- Run linter: `npm run lint`
- Format code with Prettier (if configured)

## Testing

- Write tests for new features
- Run tests: `npm test`
- Ensure all tests pass before submitting PR

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes
3. Add/update tests
4. Update documentation if needed
5. Submit PR with clear description

## Commit Messages

Use clear, descriptive commit messages:
- `feat: add QR token revocation`
- `fix: resolve meal limit calculation`
- `docs: update deployment guide`

## Questions?

Open an issue for questions or discussions.

