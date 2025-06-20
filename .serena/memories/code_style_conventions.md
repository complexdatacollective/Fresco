# Code Style and Conventions

## TypeScript
- **Strict mode enabled** with `noUncheckedIndexedAccess`
- **Always use `type` instead of `interface`** (enforced by ESLint rule)
- **Consistent type imports** with inline type imports preferred
- **Path aliases**: Use `~/*` for absolute imports from project root

## Code Style
- **Prettier configuration**:
  - Single quotes
  - 2-space indentation
  - 80 character line width
  - Tailwind plugin for class sorting
- **ESLint rules**:
  - No console statements (use proper logging)
  - No process.env access (use env.js)
  - Exhaustive switch checking
  - Import cycle detection
  - Unused variables error (except with `_` prefix)

## Next.js Patterns
- **App Router** with route groups: `(blobs)`, `(interview)`, `(setup)`
- **Server Components by default**, Client Components marked with `"use client"`
- **Server Actions** for form handling and mutations
- **Middleware** for authentication and routing

## Component Patterns
- Built on **Shadcn/ui + Radix primitives**
- **Custom UI library** with consistent design system
- **Responsive design** with Tailwind container classes
- **Redux for complex state management** (interview flows)

## File Organization
- `/app` - Next.js App Router (routes, layouts, API)
- `/lib` - Core libraries including `/interviewer` components
- `/components` - Reusable UI components
- `/actions` - Next.js Server Actions
- `/queries` - Server-side data fetching utilities