# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fresco is a web-based Network Canvas interview platform built with Next.js 14 that brings network analysis interviews to web browsers. It enables researchers to conduct network interviews online with support for various interface types (Name Generator, Sociogram, etc.).

## Current Status

The project is being heavily development, with significant new features being added.

## Development Commands

### Common Development Tasks

- `npm run dev` - Start development server with Docker PostgreSQL database
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run test` - Run Vitest unit tests
- `npm run lint` - Run ESLint code linting
- `npm run typecheck` - Run TypeScript type checking
- `npm run knip` - Detect unused code

### Testing

- `npm run test` - Run unit tests with Vitest
- `npx playwright test` - Run E2E tests (Playwright must be installed)
- `npm run load-test` - Run K6 load tests via Docker

### Database

- Uses PostgreSQL with Prisma ORM
- Database runs in Docker during development via `npm run dev`
- Prisma migrations are handled automatically

## Architecture

### Next.js App Router Structure

- Modern App Router with route groups: `(blobs)`, `(interview)`, `(setup)`
- Server Components by default, Client Components marked with `"use client"`
- API routes in `/app/api/`
- Middleware handles authentication and routing

### Key Technologies

- **Frontend**: Next.js 14, React 18.3.1, TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: Lucia Auth with session management
- **UI**: Shadcn/ui components + Tailwind CSS 4.1.10
- **State**: Redux Toolkit + React-Redux
- **Package Manager**: pnpm 9.1.1

### Directory Structure

- `/app` - Next.js App Router (routes, layouts, API)
- `/lib` - Core libraries including `/interviewer` components
- `/components` - Reusable UI components (Shadcn/ui based)
- `/actions` - Next.js Server Actions
- `/queries` - Server-side data fetching utilities
- `/prisma` - Database schema and migrations

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

- TypeScript strict mode enabled
- ESLint + Prettier configured
- Uses absolute imports with path mapping
- Server/Client component pattern with Next.js App Router
- Always use path aliases from tsconfig for imports
- ALWAYS use types instead of interfaces, unless absolutely necessary

### Database Patterns

- Prisma for type-safe database access
- Key entities: Users, Sessions, Protocols, Interviews, Participants
- JSON data storage for flexible network structures
- Connection pooling configured for production

### Component Patterns

- Custom UI library built on Shadcn/ui + Radix primitives
- Server Actions for form handling and mutations
- Client-side state management with Redux for complex interview flows
- Responsive design with Tailwind container classes

### File Upload

- Uses UploadThing for file handling
- Supports protocol files, assets, and data exports
- Integrated with database for asset management

This is a sophisticated research platform requiring careful handling of user data and interview state management.