# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fresco brings Network Canvas interviews to the web browser. It's a web-based platform for conducting network interviews, built with Next.js 14, TypeScript, and PostgreSQL.

## Development Commands

### Development

- `pnpm dev` - Start development server with Docker database
- `pnpm build` - Build the application
- `pnpm start` - Start production server

### Code Quality

- `pnpm lint` - Run ESLint
- `pnpm typecheck` - Run TypeScript type checking
- `npx prettier --write .` - Format code with Prettier

### Testing

- `pnpm test` - Run Vitest tests
- `pnpm load-test` - Run load testing with K6

### Database

- `npx prisma generate` - Generate Prisma client
- `npx prisma db push` - Push schema changes to database
- `npx prisma studio` - Open Prisma Studio

### Utilities

- `pnpm knip` - Check for unused dependencies and exports

## Architecture Overview

### Directory Structure

- `/app` - Next.js App Router pages and API routes
  - `(blobs)/` - Authentication and setup pages
  - `(interview)/` - Interview interface
  - `dashboard/` - Admin dashboard
- `/components` - Shared UI components (shadcn/ui based)
- `/lib` - Core libraries
  - `interviewer/` - Network Canvas interview engine with Redux state
  - `network-exporters/` - Data export functionality
- `/actions` - Server actions for data operations
- `/queries` - Prisma database queries
- `/schemas` - Zod validation schemas

### Key Technologies

- **Framework**: Next.js 14 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Lucia Auth
- **State Management**: Redux Toolkit (interview components)
- **UI**: Tailwind CSS with Radix UI
- **Validation**: Zod schemas
- **File Uploads**: UploadThing

### Interview Engine

The core interview functionality is in `/lib/interviewer/`, which contains:

- Redux state management in `ducks/`
- Interview UI components in `components/`
- Drag & drop behaviors in `behaviors/`
- Interface containers for different question types

### Data Flow

1. Protocols are uploaded via UploadThing and stored in the database
2. Interviews are conducted using the Redux-based interview engine
3. Network data is exported using the network-exporters library
4. Server actions handle data mutations with Zod validation

## Code Conventions

### TypeScript

- Strict mode enabled with `noUncheckedIndexedAccess`
- Use `type` over `interface` for type definitions
- Prefer inline type imports: `import { type Foo }`

### Component Structure

- Functional components with TypeScript
- Props typed with explicit types
- Default exports for pages, named exports for utilities

### File Naming

- `.tsx` for React components
- `.ts` for utilities and non-React code
- camelCase for files, PascalCase for components

### Database

- Use `cuid()` for generating IDs
- Complex data stored as Json fields (protocols, networks)
- Proper indexing on foreign keys

## Environment Configuration

Environment variables are validated using `env.js` with Zod schemas. Key variables:

- `POSTGRES_PRISMA_URL` - Database connection URL
- `POSTGRES_URL_NON_POOLING` - Non-pooling database URL
- `PUBLIC_URL` - Public URL for the application
- `DISABLE_ANALYTICS` - Disable analytics (default: false)
- `SANDBOX_MODE` - Enable sandbox mode (default: false)

## Protocol Support

- Supported schema versions: 7, 8
- Protocol files use `.netcanvas` extension
- Validation handled by `@codaco/protocol-validation`

## Development Workflow

1. Start development with `pnpm dev` (includes Docker database)
2. Make changes following the existing patterns
3. Run `pnpm lint` and `pnpm typecheck` before committing
4. Test with `pnpm test` for unit tests

## Best Practices

- Always run lint and format tasks after your work

## Debugging and Development Tips

- Use the playwright mcp to debug errors and view console output directly. Do NOT start the development server or the storybook server. Instead, prompt the user to start these for you.

- NEVER consider a task completed until you have fixed ALL typescript and eslint errors in files you have modified