# Architecture Overview

## Next.js App Router Structure
```
/app
├── (blobs)/          # Route group for blob/file handling
├── (interview)/      # Route group for interview flows
├── (setup)/          # Route group for setup/configuration
├── api/              # API routes
├── dashboard/        # Dashboard pages
└── reset/           # Reset functionality
```

## Core Directories
- `/lib` - Core business logic
  - `/interviewer` - Interview components and logic
  - `/network-query` - Network data querying
  - `/network-exporters` - Data export functionality
  - `/ui` - UI utilities and components
- `/components` - Reusable UI components
  - `/ui` - Shadcn/ui components
  - `/layout` - Layout components
  - `/DataTable` - Data table components
- `/actions` - Next.js Server Actions
- `/queries` - Server-side data fetching
- `/prisma` - Database schema and migrations

## Key Technologies Integration
- **Authentication**: Lucia Auth with session management
- **Database**: PostgreSQL + Prisma ORM with connection pooling
- **File Upload**: UploadThing for protocol files, assets, and exports
- **State Management**: Redux for complex interview flows
- **Validation**: Zod schemas for type-safe data handling

## Data Flow
1. User authentication via Lucia Auth
2. Protocol import/management via UploadThing and Prisma
3. Interview sessions with complex Redux state
4. Network data visualization and export
5. Database storage of interview results and participant data