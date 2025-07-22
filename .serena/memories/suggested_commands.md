# Suggested Development Commands

## Development
- `pnpm dev` - Start development server with Docker PostgreSQL database
- `pnpm build` - Build production application
- `pnpm start` - Start production server

## Code Quality
- `pnpm lint` - Run ESLint code linting (with env validation skipped)
- `pnpm typecheck` / `pnpm ts-lint` - Run TypeScript type checking
- `pnpm ts-lint:watch` - Run TypeScript type checking in watch mode
- `pnpm knip` - Detect unused code and dependencies
- `npx prettier --write .` - Format code with Prettier

## Testing
- `pnpm test` - Run Vitest unit tests
- `npx playwright test` - Run E2E tests (Playwright must be installed)
- `pnpm test:e2e` - Run E2E tests in test environment
- `pnpm test:e2e:ui` - Run E2E tests with UI
- `pnpm test:e2e:debug` - Debug E2E tests
- `pnpm test:e2e:report` - Show E2E test report
- `pnpm load-test` - Run K6 load tests via Docker

## Database
- Database runs in Docker during development via `pnpm dev`
- Prisma migrations are handled automatically
- `npx prisma generate` - Generate Prisma client
- `npx prisma db push` - Push schema changes to database
- `npx prisma studio` - Open Prisma Studio

## System Commands (macOS)
- `git` - Version control
- `ls` - List directory contents
- `find` - Find files and directories
- `grep` - Search text patterns (or use `rg` for ripgrep)
- `cd` - Change directory