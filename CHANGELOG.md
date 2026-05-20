# Changelog

All notable changes to Fresco are documented in this file.

## [4.0.0] — Unreleased

Fresco v4 is a major release that rearchitects the application around three pillars: a **modular interview engine** extracted into reusable npm packages, a **modern security model** built on passkeys and TOTP, and a **pluggable storage layer** with first-class S3 support. Along the way Fresco moves to Next.js 16, React 19, TypeScript 6, Zod 4, and a fully revamped dashboard, data-table, and protocol-import experience.

> **Heads-up:** v4 is a breaking release. The Prisma schema has moved, new auth and storage tables exist, the protocol schema migrates from v7 to v8, several environment variables have been replaced by in-app settings, and the file layout has changed substantially. See *Migration notes* at the end of this entry.

---

### Highlights

- **Interview engine extracted** into `@codaco/interview` — `lib/interviewer/` (226 files) and `lib/ui/` (243 files) are gone from the repo. Fresco is now a thin host for the interview Shell.
- **Passwordless authentication** — WebAuthn passkeys are now first-class, with TOTP-based 2FA, recovery codes, and brute-force protection via login-attempt logging.
- **S3-native storage** — A pluggable storage abstraction (built on Effect) lets administrators configure S3-compatible buckets from the dashboard. UploadThing remains supported as a fallback.
- **Streaming export pipeline** — Exports now stream directly to the configured storage backend with partial-success handling, descriptive error messages, and Server-Sent Events progress.
- **New programmatic API** — Versioned REST endpoints (`/api/v1/protocols-meta`, `/api/v1/interview`, `/api/v1/interview/[id]`) gated by API tokens enable external tools to discover protocols and pull interview data.
- **Rebuilt dashboard** — New activity feed, settings hub, protocol-import popover, and a from-scratch `DataTable` with metadata-driven filters and URL-persisted state.
- **Modern stack** — Next.js 14 → 16, React 18 → 19, TypeScript 5 → 6, Zod 3 → 4, Tailwind 4.1 → 4.3, Prisma 7.1 → 7.8, pnpm 10 → 11.
- **Redux is gone** — `@reduxjs/toolkit`, `react-redux`, `redux-thunk`, `redux-form`, `redux-logger`, `reselect`, and `recompose` removed. Zustand handles the small amount of remaining server-side state.
- **Preview Mode removed** — never shipped to production; its replacement is the new programmatic API plus the simpler interview host.

---

### Authentication & account security

Fresco's auth stack has been rewritten from scratch. Lucia and its Prisma adapter are removed; the new system is implemented in `lib/auth/` and exposed via server actions in `actions/`.

- **Passkeys (WebAuthn)** — Users can register one or more passkeys (security keys, Touch ID, Windows Hello, etc.) and use them as their primary sign-in method. Implemented with `@simplewebauthn/browser` and `@simplewebauthn/server`. Credentials are stored in a new `WebAuthnCredential` model with counter, transports, AAGUID, friendly name, and last-used timestamp.
- **TOTP two-factor authentication** — Optional authenticator-app 2FA using `otpauth` and QR-code enrolment via `qrcode`. Stored in `TotpCredential`.
- **Recovery codes** — Ten hashed single-use codes generated at 2FA enrolment, tracked in a new `RecoveryCode` model.
- **Sessions** — Custom session table replaces Lucia's; 24-hour active / 14-day idle expiry.
- **Brute-force protection** — A new `LoginAttempt` model records every login try (username, IP, success, timestamp) with indexes that support rate limiting and audit.
- **Password is now optional** — `Key.hashed_password` is nullable; users can be passkey-only after enrolment.
- **Account settings UI** — New `PasskeySettings` and `TwoFactorSettings` sections in dashboard settings let users manage their methods.

Removed: `@lucia-auth/adapter-prisma`, `lucia`.

### Storage & file uploads

Storage is no longer hard-wired to UploadThing.

- **Pluggable storage layer** — `lib/storage/` defines `FileStorage` and `AssetStorage` services using the [Effect](https://effect.website) library, with implementations for S3 (`S3FileStorage`) and UploadThing (`UploadThingFileStorage`). Admins choose the active backend from settings.
- **S3 / MinIO support** — New AWS SDK dependencies (`@aws-sdk/client-s3`, `@aws-sdk/lib-storage`, `@aws-sdk/s3-request-presigner`) drive multipart uploads and presigned download URLs. Endpoint, region, bucket, and credentials are configured in `AppSettings`.
- **Local dev MinIO** — `scripts/dev-s3.ts` spins up a MinIO container alongside Postgres so developers don't need real S3 credentials.
- **Presigned downloads** — New `POST /api/storage/presign` route returns time-limited presigned URLs for asset playback and download.
- **Original protocol downloads** — `Protocol.originalFileKey` / `originalFileUrl` columns let admins re-download the source `.netcanvas` file from the dashboard (PR #732).
- **Orphan blob cleanup** — `setup-database` now sweeps orphaned blobs from both S3 and UploadThing during initialization.

### Database & schema

- **Schema relocated** to `lib/db/schema.prisma` (from `prisma/schema.prisma`). Migrations live in `lib/db/migrations/`.
- **New models:** `WebAuthnCredential`, `TotpCredential`, `RecoveryCode`, `LoginAttempt`, `ApiToken`.
- **Protocol model:** gains `originalFileKey`, `originalFileUrl`, and an `experiments` JSON column; loses `isPreview` / `isPending` (Preview Mode removed).
- **Interview model:** gains `isSynthetic` boolean for test data.
- **Participant model:** gains `isSynthetic`.
- **`AppSetting` enum:** new keys for `storageProvider`, `s3Endpoint`, `s3Bucket`, `s3Region`, `s3AccessKeyId`, `s3SecretAccessKey`, `enableInterviewDataApi`.
- **Protocol schema v7 → v8** — `setup-database` runs `migrateProtocolsToV8` after `prisma migrate deploy` to bring stored protocols forward in place. Migration errors are wrapped with protocol id and name; P2002 hash collisions surface both sources.

### Interview engine extraction (`@codaco/interview`)

The interview runtime — all 226 files of `lib/interviewer/` plus the supporting Redux infrastructure — has been moved into the `@codaco/interview` package (currently `1.0.0-alpha.20`). Fresco is now a thin host:

- **Server-side assembly** — `app/(interview)/interview/[interviewId]/mapInterviewPayload.ts` turns the database record into a typed `InterviewPayload` (session state, protocol, asset URLs).
- **Client-side rendering** — `InterviewClient.tsx` is roughly 120 lines: it passes the payload to the package's `Shell` and wires four callbacks (`onStepChange`, `onSync`, `onFinish`, `onRequestAsset`) plus PostHog analytics.
- **Browser history navigation** — Step state is now managed via `nuqs` with `history: 'push'`, so the browser back/forward buttons move between interview steps and URLs are bookmarkable (`/interview/<id>?step=5`).
- **UI primitives** — The `lib/ui/` directory (243 files) has been published as `@codaco/fresco-ui` (v2.10.2). Components are imported from the package (e.g. `import { Badge } from '@codaco/fresco-ui/Badge'`).
- **Shared design tokens** — Tailwind theme moves into `@codaco/tailwind-config`.
- **Protocol validation** — `@codaco/protocol-validation` jumps from 3.0.0 to 11.5.0, adding migration helpers and v8 support.

#### State management
Redux is removed from Fresco entirely. The interview package continues to use it internally, but in Fresco itself:

- **Zustand** powers the small amount of in-memory server state (rate limiting, session helpers, dev utilities).
- **`nuqs`** owns URL-driven UI state (interview step, table filters, activity-feed filters).
- **React Server Components + Suspense** own data fetching.

### Programmatic API

A versioned REST API is introduced under `/api/v1/`, gated by the new `enableInterviewDataApi` setting and authenticated with bearer tokens managed in the dashboard:

- `GET /api/v1/protocols-meta` — Lightweight protocol metadata listing (`id`, `name`, `importedAt`, `lastModified`) for external tools.
- `GET /api/v1/interview` — Paginated interview list with filtering by protocol, participant, and status.
- `GET /api/v1/interview/[interviewId]` — Full interview detail.
- `POST /api/interviews/[interviewId]/finish` — Marks an interview complete, emits an activity-feed event, optionally sets the per-protocol completion cookie.
- `POST /api/storage/presign` — Presigned-URL generation for assets and exports.
- `POST /api/export-interviews` — SSE-driven streaming export endpoint.
- `POST /api/generate-test-interviews` — Synthetic-interview generator (admin/dev use).
- `GET /api/health` — Health check.
- `app/api/_helpers/auth.ts` & `versioning.ts` provide reusable token-auth and API-version negotiation, each covered by unit tests.

**API tokens** are managed via the new `ApiToken` Prisma model and a dashboard "API Tokens" settings section.

### Network export pipeline

The on-disk `lib/network-exporters/` (29 files, ~6,000 LOC) has been moved into the `@codaco/network-exporters` package. Fresco keeps a thin orchestration layer in `lib/export/`:

- **Streaming end-to-end** — Exports are streamed Readable→ZIP→storage; nothing is buffered in memory.
- **Output factories** — `makeS3Sink`, `makeUploadThingSink`, and `makeLocalSink` plug into the same pipeline.
- **Typed CSV generators** — `adjacencyMatrixRows`, `attributeListRows`, `edgeListRows`, `egoListRows` rewritten as typed Readable factories (legacy class-based formatters deleted).
- **Partial-success handling** — A run that hits an error on one interview now finishes the others and reports `ExportReturn` with both successes and failures.
- **User-friendly errors** — `describeExportError` classifies OOM, disk-full, timeout, connection, and unknown failures with actionable messages.
- **Progress events** — SSE events (`progress`, `complete`, `error`) defined in `lib/export/sseEvents.ts`.

### Dashboard, settings & UX

The dashboard has been substantially rebuilt.

- **Activity feed** — New home-page panel listing recent protocols, interviews, and participants, with full-text search and faceted type filtering. URL-persisted via `nuqs` under the `af_` namespace.
- **Summary statistics** — Redesigned stat cards for Protocols, Participants, and Interviews with skeleton loading states.
- **Navigation** — New `NavigationBar` and `MobileNavDrawer` for responsive layouts.
- **Settings hub** — `app/dashboard/settings/` gains dedicated sections for API tokens, configuration, developer tools, interview settings, passkeys, privacy, storage provider, synthetic interview data, two-factor auth, installation ID, S3 settings, UploadThing token, user management, and a read-only environment alert.
- **Protocol import** — Replaced the modal + reducer workflow with a lightweight `ProtocolImportPopover`, drag-and-drop dropzone, and toast-based per-file progress. Progress math lives in a unit-tested helper.
- **Default sort** — Protocols and Interviews tables now default to newest-first by import / last-updated time.

### DataTable component

`components/data-table/` (lowercase, 8 files) is replaced by `components/DataTable/` (21 files):

- **Metadata-driven filters** — Five filter types (`Range`, `Date`, `Boolean`, `Faceted`, `Operator`) declared on column definitions; no per-table custom UI.
- **URL-persisted state** — Filters and sorts hydrate from and write back to the URL via `nuqs`, so filtered views are bookmarkable.
- **Composable pieces** — `ColumnHeader`, `DataTablePagination`, `DataTableToolbar`, `DataTableFloatingBar` (bulk actions), `DataTableSkeleton`, and `SelectAllHeader` can be assembled per page.
- **Visual feedback** — Sorted and filtered columns get subtle background tints via `color-mix`.
- **Storybook + unit-tested** — 463-line story file and a 259-line filter-function test suite.

### Geospatial / Mapbox stage

- **Per-search session tokens** — UUIDv4 tokens isolate Mapbox search sessions per stage instance for billing and privacy hygiene.
- **E2E stub mode** — `GeospatialStubSearch` plus UA-based detection (`isMapboxStubBrowser`) provides a deterministic mock for Playwright tests on WebKit and Firefox, which can't run Mapbox GL natively. Real Mapbox is dynamic-imported so the stub never ships in production.
- **Visual regression baselines** for the geospatial stub were added and stabilised across browsers.

### Telemetry & observability

- **PostHog** added (`@posthog/nextjs-config`, `posthog-js`, `posthog-node`) with installation-ID tagging and graceful degradation when the database is unreachable. Captures sign-ins, password resets, passkey lifecycle events, and interview completion. Respects the existing `disableAnalytics` setting. Server helpers are non-throwing so telemetry never breaks the app.

### Tooling, CI & developer experience

- **Dev script** — `pnpm dev` now uses `concurrently` to run Postgres (`scripts/dev-db.sh`), MinIO (`scripts/dev-s3.ts`), and Next.js in parallel. `docker-compose.dev.yml` removed.
- **`pnpm typecheck` and `pnpm test:unit`** explicit scripts added; `pnpm lint` now invokes ESLint 9 directly (flat config).
- **Vitest** moves to a multi-project layout (`units` + `storybook`). New 362-line `vitest.setup.ts` mocks Motion (for React 19 callback refs) and wires `@testing-library/jest-dom/vitest`.
- **Storybook** upgraded to v10 with `@storybook/nextjs-vite`, `addon-a11y`, `addon-docs`, and `addon-vitest`. The Storybook component library doubles as a Chromatic visual-regression oracle.
- **Chromatic** — Visual-regression workflow runs on push / dispatch / `/chromatic` PR comment; auto-accepts on `main`, only-changed-story mode for speed.
- **Playwright e2e** — Visual snapshots are versioned for geospatial stages with browser-aware skips for WebKit/Firefox quirks.
- **CI hardening** (PR #750) — All third-party GitHub Actions SHA-pinned, deploy-preview actions migrated, Chromatic `issue_comment` trigger gated against fork-PR abuse, `id-token: write` scoped to the jobs that need it.
- **New tests** — Comprehensive coverage added under `actions/__tests__/`, `hooks/__tests__/`, `lib/__tests__/`, `schemas/__tests__/`, `app/api/_helpers/__tests__/`.
- **Knip** is wired into CI to flag dead code.
- **Branch preview build** — New `build:branch-preview` script for Netlify deploy previews.

### Stack upgrades

| Package | v3 | v4 |
| --- | --- | --- |
| Next.js | 14.2.x | 16.2.6 |
| React / React DOM | 18.3.1 | 19.2.6 |
| TypeScript | 5.x | 6.0.3 |
| Tailwind CSS | 4.1.x | 4.3.0 |
| Prisma (client + adapters) | 7.1 | 7.8 |
| Zod | 3.25 | 4.4 |
| `react-hook-form` | 7.x | replaced by `@codaco/fresco-ui` form layer |
| `react-markdown` | 9 | 10 |
| `react-dropzone` | 14 | 15 |
| `lucide-react` | 0.554 | 1.16 |
| `nuqs` | 1 | 2 |
| pnpm | 10.24 | 11.1.2 (sha-pinned) |

New runtime dependencies of note: `effect`, `superjson`, `zustand`, `immer`, `@base-ui/react`, `@codaco/fresco-ui`, `@codaco/interview`, `@codaco/network-exporters`, `@codaco/protocol-validation@^11.5.0`, `@codaco/tailwind-config`, `@codaco/shared-consts@5.0.0`, `@faker-js/faker`, `@posthog/nextjs-config`, `posthog-js`, `posthog-node`, `qrcode`, `otpauth`, `@simplewebauthn/{browser,server}`, all three `@aws-sdk/*` clients.

Removed: `animejs`, `archiver`, `class-variance-authority`, `classnames`, `cmdk`, `color`, `concaveman`, `csvtojson`, `d3`, `dotenv` (dev only), `fuse.js`, `jssha`, `lucia`, `@lucia-auth/adapter-prisma`, all 13 individual `@radix-ui/*` packages (consolidated into `@base-ui/react`), `@reduxjs/toolkit`, `react-redux`, `react-compound-slider`, `react-flip-toolkit`, `react-resize-aware`, `react-transition-group`, `react-virtualized-auto-sizer`, `react-window`, `recompose`, `redux-form`, `redux-logger`, `redux-thunk`, `rehype-raw`, `rehype-sanitize`, `remark`, `remark-gemoji`, `reselect`, `sanitize-filename`, `scrollparent`, `strip-markdown`, `tailwind-merge`, `@tailwindcss/aspect-ratio`, `@tailwindcss/container-queries`, `@tailwindcss/typography`, `@uploadthing/react`, `@xmldom/xmldom`, `uuid`, `validator`, `zod-form-data`. Plus several smaller leaf utilities.

### Removed features

- **Preview Mode** (PR #751) — Never released. The new `/api/v1/*` endpoints and the simplified interview host cover the same use case.
- **Local network-exporters / network-query code** — Moved to `@codaco/network-exporters` and consumed as a dependency.
- **In-repo interview runtime** — Moved to `@codaco/interview`.
- **In-repo UI primitives** — Moved to `@codaco/fresco-ui`.

### Migration notes

If you are upgrading an existing Fresco deployment:

1. **Back up your database first.** v4 introduces auth, storage, and protocol-schema migrations that are not reversible without restoring from backup.
2. The `prisma` directory is gone. The schema is now `lib/db/schema.prisma`; if you have custom tooling pointed at the old path, update it.
3. Run `pnpm build:platform` (or your equivalent platform build). It will run `prisma migrate deploy` and then `migrateProtocolsToV8` to bring stored protocols forward from schema v7 to v8 in place.
4. Existing users will need to **set a new password or register a passkey** on first sign-in; their Lucia session will not survive the upgrade.
5. **Decide on storage** before first use: keep UploadThing (re-paste your token in dashboard settings) or switch to an S3-compatible bucket and enter endpoint/region/key/secret in the new Storage Provider settings panel.
6. If you relied on the unreleased **Preview Mode** workflow, migrate to the new `/api/v1/protocols-meta` + `/api/v1/interview` endpoints with API tokens issued from the dashboard.
7. The `dev` workflow now runs MinIO locally via `scripts/dev-s3.ts`. If you are bringing up a dev environment, ensure Docker is available; the old `docker-compose.dev.yml` is no longer used.
8. Custom integrations that imported from `~/lib/interviewer/*`, `~/lib/ui/*`, or `~/lib/network-exporters/*` must be repointed at the new packages.
