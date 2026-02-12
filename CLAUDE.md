# CLAUDE.md - AI Assistant Guide for Fresco

This document provides guidance for AI assistants working with the Fresco codebase.

## Project Overview

Fresco is a web-based interview platform that brings Network Canvas interviews to the browser. It's built with Next.js 14 (App Router), TypeScript, and PostgreSQL. Version 3.0.0.

**Documentation**: <https://documentation.networkcanvas.com/en/fresco>

## Quick Reference

```bash
# Development
pnpm install                    # Install dependencies
pnpm dev                        # Start dev server (auto-starts PostgreSQL via Docker)
pnpm storybook                  # Component library at :6006

# Quality Checks
pnpm lint                       # ESLint
pnpm typecheck                    # TypeScript type checking
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
- **Do not use type assertions (`as`)** to fix type errors unless absolutely necessary. Find the root cause of the typing issue and refactor to resolve it. Type assertions should ALWAYS be confirmed with the user first.
- Use `type` for type definitions (not `interface`) - enforced by ESLint
- Prefer inline type imports: `import { type Foo } from './bar'`
- Unused variables must start with underscore: `_unusedVar`
- **Always use path aliases** (`~/`) for imports - never use relative paths like `../` or `./`

```typescript
// Correct - use path aliases
import { type Protocol } from '@prisma/client';
import { cx } from '~/utils/cva';
import { Button } from '~/components/ui/Button';

// Incorrect - never use relative paths
// import { Button } from '../components/ui/Button';

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
- Use `safeUpdateTag()` for cache invalidation (read-your-own-writes)
- Track events with `addEvent()` for activity feed

```typescript
'use server';

import { requireApiAuth } from '~/utils/auth';
import { safeUpdateTag } from '~/lib/cache';
import { prisma } from '~/utils/db';

export async function deleteItem(id: string) {
  await requireApiAuth();

  try {
    const result = await prisma.item.delete({ where: { id } });
    safeUpdateTag('getItems');
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
- **Spread HTML props onto root element** - Components should accept all valid HTML attributes for their root element and spread them. This allows consumers to pass `data-testid`, `aria-*`, event handlers, etc. without the component needing explicit props for each.

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

// Example: spreading props onto root element
const Button = ({ variant, className, ...props }: ButtonProps) => (
  <button className={cn(buttonVariants({ variant }), className)} {...props} />
);
```

**Why spread props?** Instead of adding specific props like `testId`, accept all HTML attributes and spread them. This:

- Keeps the component API minimal
- Allows any valid HTML attribute (`data-testid`, `aria-label`, `onClick`, etc.)
- Follows React best practices for wrapper components

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

### Caching

Query functions in `/queries/` use the `'use cache'` directive with typesafe tag wrappers from `~/lib/cache`. Do not import `cacheTag`, `updateTag`, `revalidateTag`, or `unstable_cache` directly from `next/cache` - an ESLint `no-restricted-imports` rule enforces this.

**Cached queries** use `safeCacheTag()` inside `'use cache'` functions:

```typescript
import { safeCacheTag } from '~/lib/cache';

export async function getItems() {
  'use cache';
  safeCacheTag('getItems');
  return prisma.item.findMany();
}
```

**Cache invalidation** uses two different functions depending on context:

- **`safeUpdateTag(tag)`** - Server Actions only. Uses `updateTag` for read-your-own-writes semantics (the next request waits for fresh data, so the user sees their change immediately).
- **`safeRevalidateTag(tag)`** - Route Handlers only. Uses `revalidateTag(tag, 'max')` for stale-while-revalidate semantics (`updateTag` is not available in Route Handlers).

Both accept a single tag or an array. All tags are typesafe against the `CacheTags` array in `lib/cache.ts`.

**Disabling cache for tests**: Set `DISABLE_NEXT_CACHE=true` which activates the no-op `cacheHandler` in `next.config.js` (`lib/cache-handler.cjs`). This returns cache misses for all `'use cache'` functions.

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

### E2E Testing Conventions

- **Prefer `data-testid` attributes** over text matching for element selection in e2e tests. This makes tests more resilient to text changes and internationalization.
- Add `data-testid` attributes to interactive elements and key UI components that need to be targeted in tests.
- See `tests/e2e/CLAUDE.md` for detailed e2e testing patterns and fixtures.

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
5. Invalidate cache with `safeUpdateTag()`

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
6. **Cache invalidation** - use `safeUpdateTag()` in Server Actions, `safeRevalidateTag()` in Route Handlers (see Caching section)
7. **Always use path aliases** - use `~/components/Button` not `../components/Button`

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

## Debugging and Development Tips

- Use the Playwright MCP to debug errors and view console output directly. Do NOT start the development server or the storybook server. Instead, prompt the user to start these for you.
- NEVER disable linting rules unless you have asked permission from the user. This applies particularly to no-explicit-any which should only be disabled in truly exceptional circumstances.
- when editing a component, look for a storybook story and ensure that any new features are documented and any changes to the component API are accurately reflected in the storybook

## E2E Test Selector Best Practices

When writing Playwright e2e tests, follow this selector hierarchy:

1. **Prefer semantic `getByRole()` queries** - These are resilient and accessible:
   - `getByRole('button', { name: /submit/i })`
   - `getByRole('heading', { name: 'Settings', level: 1 })`
   - `getByRole('switch')`, `getByRole('dialog')`, `getByRole('table')`

2. **Use `getByTestId()` for non-semantic elements** - Add `data-testid` attributes to components:
   - `getByTestId('user-row-testadmin')`
   - `getByTestId('anonymous-recruitment-field')`

3. **Avoid these fragile patterns:**
   - `getByText()` - Breaks with text changes, i18n
   - `toContainText()` / `toHaveText()` - Ties tests to specific copy, prevents refactoring
   - `.first()` - Tied to DOM order
   - `.locator('..')` - Parent traversal is fragile
   - `.locator('#id')` - Prefer getByTestId for consistency

4. **Test element presence, not text content** - Avoid assertions on specific text. Instead, test that elements exist using `toBeVisible()`. This allows copy changes without breaking tests.

5. **For form fields with switches/toggles**, combine testId with role:

   ```typescript
   page.getByTestId('anonymous-recruitment-field').getByRole('switch');
   ```

6. **Add testIds to reusable components** (SettingsField, SettingsCard, DataTable rows, etc.) to enable targeted selection without DOM traversal.
