# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fresco is a web-based Network Canvas interview platform built with Next.js 14 that brings network analysis interviews to web browsers. It's a pilot project that enables researchers to conduct network interviews online with support for various interface types (Name Generator, Sociogram, etc.) without adding new features to Network Canvas.

## Current Status

The project is in heavy development with significant new features being added. It's on version 3.0.0.

## Development Commands

### Development

- `pnpm dev` - Start development server with Docker PostgreSQL database
- `pnpm build` - Build production application
- `pnpm start` - Start production server

### Code Quality

- `pnpm lint` - Run ESLint code linting
- `pnpm typecheck` / `pnpm ts-lint` - Run TypeScript type checking
- `pnpm knip` - Detect unused code and dependencies
- `npx prettier --write .` - Format code with Prettier

### Testing

- `pnpm test` - Run Vitest unit tests
- `npx playwright test` - Run E2E tests (Playwright must be installed)
- `pnpm test:e2e` - Run E2E tests in test environment
- `pnpm test:e2e:ui` - Run E2E tests with UI
- `pnpm test:e2e:debug` - Debug E2E tests
- `pnpm test:e2e:report` - Show E2E test report
- `pnpm load-test` - Run K6 load tests via Docker

### Database

- Database runs in Docker during development via `pnpm dev`
- Prisma migrations are handled automatically
- `npx prisma generate` - Generate Prisma client
- `npx prisma db push` - Push schema changes to database
- `npx prisma studio` - Open Prisma Studio

## Architecture

### Next.js App Router Structure

- Modern App Router with route groups: `(blobs)`, `(interview)`, `(setup)`
- Server Components by default, Client Components marked with `"use client"`
- API routes in `/app/api/`
- Middleware handles authentication and routing

### Key Technologies

- **Framework**: Next.js 14 with App Router, React 18.3.1, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Lucia Auth with session management
- **UI**: Shadcn/ui components + Tailwind CSS 4.1.10 with Radix UI
- **State Management**: Redux Toolkit + React-Redux (for interview components)
- **File Uploads**: UploadThing
- **Validation**: Zod schemas
- **Package Manager**: pnpm 9.1.1

### Directory Structure

- `/app` - Next.js App Router (routes, layouts, API)
  - `(blobs)/` - Authentication and setup pages
  - `(interview)/` - Interview interface
  - `dashboard/` - Admin dashboard
- `/lib` - Core libraries including `/interviewer` components
  - `interviewer/` - Network Canvas interview engine with Redux state
  - `network-exporters/` - Data export functionality
- `/components` - Reusable UI components (Shadcn/ui based)
- `/actions` - Next.js Server Actions for data operations
- `/queries` - Server-side data fetching utilities (Prisma database queries)
- `/schemas` - Zod validation schemas
- `/prisma` - Database schema and migrations

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

### Authentication System

- Uses Lucia Auth for session-based authentication
- Protected routes handled by middleware
- User management with username/password
- Session persistence across requests

### Network Canvas Integration

- Protocol import/export functionality
- Interview session management with complex state
- Multiple interface types with specialized components
- Network data visualization and export capabilities

## Development Notes

### Code Style

- TypeScript strict mode enabled with `noUncheckedIndexedAccess`
- ESLint + Prettier configured
- Uses absolute imports with path mapping (`~/` prefix)
- Server/Client component pattern with Next.js App Router
- **ALWAYS use types instead of interfaces** (ESLint enforced)
- Prefer inline type imports: `import { type Foo }`

### Database Patterns

- Prisma for type-safe database access
- Key entities: Users, Sessions, Protocols, Interviews, Participants
- Use `cuid()` for generating IDs
- JSON data storage for flexible network structures (protocols, networks)
- Connection pooling configured for production
- Proper indexing on foreign keys

### Component Patterns

- Custom UI library built on Shadcn/ui + Radix primitives
- Server Actions for form handling and mutations
- Client-side state management with Redux for complex interview flows
- Responsive design with Tailwind container classes
- Functional components with TypeScript
- Props typed with explicit types
- Default exports for pages, named exports for utilities

### File Naming

- `.tsx` for React components
- `.ts` for utilities and non-React code
- camelCase for files, PascalCase for components

### Environment Configuration

Environment variables are validated using `env.js` with Zod schemas. Key variables:

- `POSTGRES_PRISMA_URL` - Database connection URL
- `POSTGRES_URL_NON_POOLING` - Non-pooling database URL
- `PUBLIC_URL` - Public URL for the application
- `DISABLE_ANALYTICS` - Disable analytics (default: false)
- `SANDBOX_MODE` - Enable sandbox mode (default: false)

### Protocol Support

- Supported schema versions: 7, 8
- Protocol files use `.netcanvas` extension
- Validation handled by `@codaco/protocol-validation`

## Development Workflow

1. Start development with `pnpm dev` (includes Docker database)
2. Make changes following the existing patterns
3. Run `pnpm lint` and `pnpm typecheck` before committing
4. Test with `pnpm test` for unit tests

## Best Practices

- Always run lint and typecheck tasks after your work
- When creating new tests, always add data attributes to components that are being tested
- Follow the established patterns in the codebase
- Use Server Components by default, Client Components only when needed

## Debugging and Development Tips

- Use the playwright mcp to debug errors and view console output directly
- Do NOT start the development server or the storybook server - prompt the user to start these

This is a sophisticated research platform requiring careful handling of user data and interview state management.