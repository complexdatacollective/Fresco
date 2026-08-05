# CLAUDE.md — Fresco

Guidance for Claude Code and Codex working in `apps/fresco`. The repository-wide
rules in the root `CLAUDE.md` apply here too; this file covers only what is
specific to this app.

## What Fresco is

Fresco brings Network Canvas interviews to the browser: researchers upload a
protocol, manage participants, and share interview URLs; participants complete
the interview in a browser rather than a native app. It is a self-hosted
deployment — each installation is one research team's own instance, backed by
its own PostgreSQL database and object storage.

**Documentation**: <https://documentation.networkcanvas.com/en/fresco>

## Where Fresco lives, and how it ships

Fresco is developed **here, in the monorepo**. The standalone
`complexdatacollective/Fresco` repository is a **mirror**, not a source of
truth — do not edit it, and do not treat anything in it as authoritative.

Releases flow one way:

1. A changeset targeting `fresco` bumps the version in the normal Changesets
   lane (see the root `CLAUDE.md` and the `creating-a-changeset` skill).
2. When the Version Packages PR merges, the `apps-release-fresco` job in
   `.github/workflows/ci-and-release.yml` runs `scripts/mirror-app.mjs`, which
   replaces the Fresco repo's `main` with this app's source. Every
   `workspace:`/`catalog:` specifier is resolved to a registry version, and the
   single-package `pnpm-workspace.yaml` and lockfile the Dockerfile needs are
   generated.
3. That push to `main` triggers `.github/workflows/docker-publish.yml` **in the
   mirror**, which builds the container image and pushes it to GHCR tagged with
   the version and `latest`.

Consequences worth remembering:

- `apps/fresco/.github/` contains only the mirror's Docker publish workflow. CI
  for development runs from the monorepo's own workflows.
- The `Dockerfile` builds the _mirrored_ tree, so it assumes a standalone,
  single-package pnpm project. If you change what it copies, check
  `scripts/mirror-app.mjs` still produces those files.
- Workspace packages are consumed from source here but from **npm dist** in the
  mirror. Code that only works under one bundler will pass locally and fail in
  the released image — see "Workers and bundler portability" below.

## Commands

```bash
pnpm --filter fresco dev          # Postgres + MinIO via Docker, then next dev
pnpm --filter fresco build        # next build
pnpm --filter fresco typecheck
pnpm --filter fresco test        # vitest, units project
pnpm --filter fresco storybook
```

Lint and format are repository-wide, not per-app: `pnpm lint` (oxlint + oxfmt)
and `pnpm lint:fix` from the root. Fresco has no ESLint or Prettier setup — its
app-specific rules live in `apps/fresco/.oxlintrc.json`.

## Architecture

```
app/                 # App Router
├── (blobs)/        # Setup wizard and authentication (route group)
├── (interview)/    # Participant interview surface
├── dashboard/      # Researcher dashboard
├── api/            # Route handlers
└── reset/          # Password reset

actions/            # Server Actions
queries/            # Cached database reads
schemas/            # Zod schemas
lib/
├── auth/           # Sessions, guards, passwords, WebAuthn, TOTP
├── cache/          # Typesafe cache-tag wrappers
├── db/             # Prisma schema, client, migrations
├── export/         # Export orchestration (@codaco/network-exporters)
├── protocol/       # Protocol import and migration
├── storage/        # S3 / UploadThing asset storage
└── uploadthing/
```

### Stack

- **Next.js** (App Router, Turbopack) with `cacheComponents` and `typedRoutes`
- **React** with the React Compiler enabled
- **PostgreSQL** via **Prisma**, schema at `lib/db/schema.prisma`
- **Auth** is first-party: sessions in `lib/auth/session.ts`, plus WebAuthn
  passkeys and TOTP. There is no third-party auth library.
- **Tailwind** with `@codaco/tailwind-config`, components from
  `@codaco/fresco-ui`. There is no local `components/ui` — reach for the shared
  design system first.
- **The interview itself is `@codaco/interview`.** Fresco is a _host_: it renders
  `<Shell>` in `app/(interview)/interview/[interviewId]/InterviewClient.tsx` and
  supplies the sync, finish, and asset-request handlers. Interview behaviour
  belongs in the package, not here.

## Conventions

### TypeScript

The tsconfig extends `@codaco/tsconfig/web.json` and **must not add
app-specific compiler options** — if something seems to need one, raise it
rather than adding it. Inherited settings worth knowing: `noUncheckedIndexedAccess`,
`erasableSyntaxOnly` (no parameter properties, no enums), and
`@total-typescript/ts-reset` (so `JSON.parse` returns `unknown`, and
`.filter(Boolean)` narrows).

- Never use `any`.
- Avoid type assertions (`as`). Find the root cause instead; confirm with the
  user before adding one.
- `type`, not `interface`.
- Import with the `~/` alias, never relative paths.

### Environment variables

Never read `process.env` directly — import the validated `env` from `~/env.js`.
The oxlint `no-process-env` rule enforces this.

### Server Actions

Live in `actions/`, marked `'use server'`, authenticated with
`requireApiAuth()`, returning `{ error, data }`. Invalidate caches with
`safeUpdateTag()` and record activity with `addEvent()`.

### Caching

Query functions in `queries/` use `'use cache'` with the typesafe wrappers from
`~/lib/cache`; tags are checked against the `CacheTags` array there. Importing
`cacheTag`/`updateTag`/`revalidateTag` from `next/cache` directly is blocked by
lint.

- `safeCacheTag(tag)` — inside a `'use cache'` function.
- `safeUpdateTag(tag)` — Server Actions. Read-your-own-writes.
- `safeRevalidateTag(tag)` — Route Handlers, where `updateTag` is unavailable.

### zod/mini in client-reachable code

`app/`, `components/`, `hooks/`, and `lib/` must import from `zod/mini` to keep
client bundles small. Server-only trees (`actions/`, `queries/`, `schemas/`) and
route handlers use standard `zod` behind `import 'server-only'` guards. Enforced
by lint.

### Workers and bundler portability

Fresco compiles workspace-package **source** with Turbopack, while the released
image installs those packages' **dist** from npm. Vite-specific syntax
(`?worker&inline`, `?url`, `?raw`) therefore compiles in the packages' own build
but breaks here. Packages construct workers via a portable factory
(`new Worker(new URL(...), { type: 'module' })`) with a build-time swap to the
inlined form — see `packages/fresco-ui/src/collection/filtering/createSearchWorker.ts`.
If you add a worker or a non-JS import to a shared package, build Fresco to
check it before assuming it works.

## Gotchas

1. **`AppSettings` must stay in sync** between `lib/db/schema.prisma` and
   `schemas/appSettings.ts`.
2. **Server Components are the default.** Add `'use client'` only where needed.
3. **Storybook stories are part of the component contract** — update the story
   when you change a component's API.
4. **Never disable a lint rule without asking**, `no-explicit-any` least of all.
5. **A stale `tsconfig.tsbuildinfo`** produces phantom type errors. Delete it
   before trusting a confusing `tsc` result.
