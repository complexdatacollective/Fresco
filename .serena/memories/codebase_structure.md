# Codebase Structure

## Main Directories

### `/app` - Next.js App Router
- **`(blobs)/`** - Setup and authentication pages
- **`(interview)/`** - Interview interface and routing
- **`api/`** - API routes (analytics, uploadthing)
- **`dashboard/`** - Admin dashboard pages and components

### `/components` - Shared UI Components
- **`ui/`** - Base UI components (shadcn/ui based)
- **`data-table/`** - Data table components
- **`layout/`** - Layout components

### `/lib` - Core Libraries
- **`interviewer/`** - Network Canvas interview engine
  - `behaviors/` - Drag & drop, form behaviors
  - `components/` - Interview UI components
  - `containers/` - Interface containers
  - `ducks/` - Redux state management
- **`network-exporters/`** - Data export functionality
- **`ui/`** - UI library components

### `/actions` - Server Actions
Server-side functions for data operations

### `/queries` - Database Queries
Prisma-based data fetching functions

### `/schemas` - Validation Schemas
Zod schemas for data validation

### `/utils` - Utility Functions
Helper functions and utilities

## Key Files
- **`prisma/schema.prisma`** - Database schema
- **`env.js`** - Environment validation
- **`fresco.config.ts`** - Application configuration