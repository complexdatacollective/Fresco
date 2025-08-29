# Suggested Development Commands

## Development

- `pnpm dev` - Start development server (includes Docker database setup)
- `pnpm build` - Build the application
- `pnpm start` - Start production server

## Code Quality

- `pnpm lint` - Run ESLint (with env validation skipped)
- `pnpm ts-lint` - Run TypeScript type checking
- `pnpm ts-lint:watch` - Run TypeScript type checking in watch mode

## Testing

- `pnpm test` - Run Vitest tests

## Database

- `npx prisma generate` - Generate Prisma client
- `npx prisma db push` - Push schema changes to database
- `npx prisma studio` - Open Prisma Studio

## Utilities

- `pnpm knip` - Check for unused dependencies and exports
- `npx prettier --write .` - Format code with Prettier

## System Commands (macOS)

- `ls` - List directory contents
- `cd` - Change directory
- `grep` - Search text patterns
- `find` - Find files and directories
- `git` - Git version control
