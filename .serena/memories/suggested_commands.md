# Suggested Commands

## Development
- `npm run dev` - Start development server with Docker PostgreSQL database
- `npm run build` - Build production application
- `npm run start` - Start production server

## Code Quality
- `npm run lint` - Run ESLint code linting
- `npm run typecheck` - Run TypeScript type checking
- `npm run knip` - Detect unused code

## Testing
- `npm run test` - Run Vitest unit tests
- `npx playwright test` - Run E2E tests (Playwright must be installed)
- `npm run test:e2e` - Run E2E tests in test environment
- `npm run test:e2e:ui` - Run E2E tests with UI
- `npm run test:e2e:debug` - Debug E2E tests
- `npm run test:e2e:report` - Show E2E test report
- `npm run load-test` - Run K6 load tests via Docker

## Database
- Database runs in Docker during development via `npm run dev`
- Prisma migrations are handled automatically

## System Commands (macOS)
- `git` - Version control
- `ls` - List directory contents
- `find` - Find files and directories
- `grep` - Search text patterns (or use `rg` for ripgrep)
- `cd` - Change directory