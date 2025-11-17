# CLAUDE.md - AI Assistant Guide for Fresco

This document provides guidance for AI assistants working with the Fresco codebase.

## Project Overview

Fresco is a web-based interview platform that brings Network Canvas interviews to the browser. It's built with Next.js 14 (App Router), TypeScript, and PostgreSQL. Version 3.0.0.

**Documentation**: https://documentation.networkcanvas.com/en/fresco

## Quick Reference

```bash
# Development
pnpm install                    # Install dependencies
pnpm dev                        # Start dev server (auto-starts PostgreSQL via Docker)
pnpm storybook                  # Component library at :6006

# Quality Checks
pnpm lint                       # ESLint
pnpm ts-lint                    # TypeScript type checking
pnpm test                       # Vitest unit tests
pnpm knip                       # Find unused code

# Build
pnpm build                      # Production build
pnpm build:platform             # Full build with DB setup (Vercel)
```

## Architecture

### Directory Structure

```
app/                    # Next.js App Router pages and API routes
├── (blobs)/           # Setup & authentication (route group)
├── (interview)/       # Interview interface (route group)
├── dashboard/         # Admin dashboard pages
├── api/               # API endpoints
└── reset/             # Password reset

actions/               # Server Actions (Next.js)
components/            # React components
├── ui/               # shadcn/ui base components
├── data-table/       # Table components
└── layout/           # Layout components

lib/                   # Core business logic
├── interviewer/      # Interview session management (Redux)
├── network-exporters/ # Data export functionality
└── network-query/    # Network analysis utilities

hooks/                 # Custom React hooks
queries/               # Database query functions
schemas/               # Zod validation schemas
types/                 # TypeScript type definitions
utils/                 # Utility functions
prisma/                # Database schema
styles/                # Global CSS/SCSS
```

### Tech Stack

- **Framework**: Next.js 14.2 with App Router
- **Language**: TypeScript 5.8 (strict mode)
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: Lucia authentication
- **Styling**: Tailwind CSS 4.1 + shadcn/ui
- **State Management**: Redux Toolkit (interview sessions)
- **Forms**: React Hook Form + Zod validation
- **Package Manager**: pnpm 9.1.1

## Code Conventions

### TypeScript

- **Strict mode enabled** with `noUncheckedIndexedAccess`
- Use `type` for type definitions (not `interface`) - enforced by ESLint
- Prefer inline type imports: `import { type Foo } from './bar'`
- Unused variables must start with underscore: `_unusedVar`
- Path alias: `~/` maps to project root

```typescript
// Correct
import { type Protocol } from '@prisma/client';
import { cn } from '~/utils/shadcn';

// Type definition
export type CreateInterview = {
  participantIdentifier?: string;
  protocolId: string;
};
```

### Environment Variables

- **Never use `process.env` directly** - ESLint will error
- Import from `~/env.js` which validates with Zod:

```typescript
import { env } from '~/env.js';
const dbUrl = env.DATABASE_URL;
```

### Console Logging

- `no-console` ESLint rule is enforced
- Must disable ESLint for intentional logs:
```typescript
// eslint-disable-next-line no-console
console.log('Debug info');
```

### Server Actions

Located in `/actions/`. Pattern:
- Mark with `'use server'` directive
- Use `requireApiAuth()` for authentication
- Return `{ error, data }` pattern
- Use `safeRevalidateTag()` for cache invalidation
- Track events with `addEvent()` for activity feed

```typescript
'use server';

import { requireApiAuth } from '~/utils/auth';
import { safeRevalidateTag } from '~/lib/cache';
import { prisma } from '~/utils/db';

export async function deleteItem(id: string) {
  await requireApiAuth();

  try {
    const result = await prisma.item.delete({ where: { id } });
    safeRevalidateTag('getItems');
    return { error: null, data: result };
  } catch (error) {
    return { error: 'Failed to delete', data: null };
  }
}
```

### Page Components (App Router)

- Server Components by default
- Use `'use client'` directive only when needed
- Authenticate with `requirePageAuth()` or `requireAppNotExpired()`
- Wrap async operations in `<Suspense>`

```typescript
import { requirePageAuth } from '~/utils/auth';

export default async function DashboardPage() {
  await requirePageAuth();

  return (
    <Suspense fallback={<Loading />}>
      <AsyncComponent />
    </Suspense>
  );
}
```

### UI Components

Using shadcn/ui with Tailwind. Follow the pattern:
- Use `cva` (class-variance-authority) for variants
- Use `cn()` utility from `~/utils/shadcn` for class merging
- Export component + variants + skeleton when applicable

```typescript
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '~/utils/shadcn';

const buttonVariants = cva('base-classes', {
  variants: {
    variant: { default: '...', destructive: '...' },
    size: { default: '...', sm: '...' },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

export type ButtonProps = {
  variant?: VariantProps<typeof buttonVariants>['variant'];
} & React.ButtonHTMLAttributes<HTMLButtonElement>;
```

### Forms with Zod

Use the custom `useZodForm` hook:

```typescript
import useForm from '~/hooks/useZodForm';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

function MyForm() {
  const form = useForm({ schema });
  // ...
}
```

### Database (Prisma)

- Schema at `prisma/schema.prisma`
- Client imported from `~/utils/db`
- Uses connection pooling (DATABASE_URL) and direct connection (DATABASE_URL_UNPOOLED)
- Key models: User, Protocol, Interview, Participant, AppSettings, Events

```typescript
import { prisma } from '~/utils/db';

const interviews = await prisma.interview.findMany({
  where: { protocolId },
  include: { participant: true },
});
```

### Naming Conventions

- **Files**: PascalCase for components (`Button.tsx`), camelCase for utils (`shadcn.ts`)
- **Schemas**: Located in `/schemas/`, use Zod, prefix types with schema name
- **Hooks**: camelCase starting with `use` (`useZodForm.ts`)
- **Actions**: camelCase functions (`deleteInterviews`)
- **Routes**: kebab-case folders matching URL paths

## Formatting

Prettier configuration (`.prettierrc`):
- Single quotes
- 80 character print width
- Tailwind class sorting plugin

ESLint:
- TypeScript strict type checking
- Next.js Core Web Vitals
- No unused variables (except `_` prefix)
- Consistent type imports

## Testing

- **Unit Tests**: Vitest with React Testing Library
- **E2E Tests**: Playwright (via GitHub Actions)
- **Visual Tests**: Storybook with Chromatic
- **Load Tests**: k6 (`pnpm load-test`)

Run tests:
```bash
pnpm test           # Unit tests
pnpm storybook      # Component testing
```

## Important Files

- `fresco.config.ts` - App-specific constants (protocol extensions, timeouts)
- `env.js` - Environment variable validation
- `next.config.js` - Next.js configuration
- `components.json` - shadcn/ui configuration
- `.nvmrc` - Node.js version (20)
- `docker-compose.dev.yml` - Development database

## Common Tasks

### Adding a New Server Action

1. Create function in `/actions/`
2. Add `'use server'` directive
3. Add auth check with `requireApiAuth()`
4. Define input types in `/schemas/`
5. Invalidate cache with `safeRevalidateTag()`

### Adding a New Page

1. Create folder in `/app/` following route structure
2. Add `page.tsx` (Server Component)
3. Add auth check at top
4. Use existing layout components from `/components/layout/`

### Adding UI Components

1. Check if shadcn/ui has it first
2. Add to `/components/ui/`
3. Use `cva` for variants
4. Export types and skeleton variant

### Working with Forms

1. Define Zod schema in `/schemas/`
2. Use `useZodForm` hook
3. Connect to React Hook Form
4. Handle server action submission

## Git Workflow

- Main branch protection likely enabled
- Dependabot configured for security updates
- GitHub Actions for CI/CD (build checks, Playwright tests, Docker publishing)

## Gotchas

1. **No direct `process.env`** - use `~/env.js`
2. **No `console.log`** without ESLint disable
3. **Use `type` not `interface`** for type definitions
4. **Server Components are default** - add `'use client'` only when needed
5. **AppSettings enum** must sync between Prisma schema and `schemas/appSettings.ts`
6. **Cache invalidation** - use `safeRevalidateTag()` after mutations

## Dependencies to Know

- `@codaco/protocol-validation` - Protocol validation
- `lucia` - Authentication
- `nuqs` - URL state management
- `uploadthing` - File uploads
- `es-toolkit` - Modern lodash alternative
- `luxon` - Date/time (not moment.js)

## Resources

- [Network Canvas Documentation](https://documentation.networkcanvas.com/en/fresco)
- [Next.js App Router](https://nextjs.org/docs/app)
- [shadcn/ui](https://ui.shadcn.com/)
- [Prisma](https://www.prisma.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
