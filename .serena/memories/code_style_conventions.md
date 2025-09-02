# Code Style and Conventions

## TypeScript Configuration

- Strict mode enabled
- noUncheckedIndexedAccess enabled
- ESModule imports/exports
- Path mapping with `~/*` for project root

## ESLint Rules

- TypeScript strict rules enabled
- Consistent type definitions (prefer `type` over `interface`)
- Type imports preferred with inline syntax
- No unused variables (args starting with `_` ignored)
- No console statements (use proper logging)
- No direct process.env access

## Code Style

- **Prettier**: Single quotes, 80 character line width, Tailwind CSS plugin
- **File Extensions**: `.tsx` for React components, `.ts` for utilities
- **Import Style**: Type imports inline, consistent type imports
- **Naming**: camelCase for variables/functions, PascalCase for components

## Component Structure

- React functional components with TypeScript
- Props typed with explicit interfaces/types
- Default exports for pages and main components
- Named exports for utilities and hooks

## Database

- Prisma ORM with PostgreSQL
- cuid() for IDs
- Proper indexing on foreign keys
- Json fields for complex data (protocols, networks)
