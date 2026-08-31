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
  for development runs from the monorepo's own workflows. The release token has
  contents-write permission only: before mirroring, the publisher in the
  external repo must already be byte-identical to this source-controlled copy,
  and no other workflows may be present. To change the publisher, first apply
  the exact change to the external repo with a maintainer credential that can
  update workflows; the normal mirror then carries the identical file forward
  without adding, changing, or deleting workflow files.
- The `Dockerfile` builds the _mirrored_ tree, so it assumes a standalone,
  single-package pnpm project. If you change what it copies, check
  `scripts/mirror-app.mjs` still produces those files.
- Workspace packages are consumed from source here but from **npm dist** in the
  mirror. Code that only works under one bundler will pass locally and fail in
  the released image — see "Workers and bundler portability" below.

## Release testing

Before a Fresco release is approved (the Version Packages PR merged), the
pending state of `main` can be release-tested locally with the
`/fresco-release-test` Claude workflow (`.claude/workflows/fresco-release-test.js`;
Codex: run the harness scripts below manually). It builds the pending image the
way a release would — `scripts/mirror-app.mjs` stages the mirrored tree,
`release-test/scripts/bundle-pending-packages.mjs` swaps the registry
resolutions of exactly the `@codaco/*` packages the pending changesets will
publish for tarballs packed from the pending source (the rest of the closure
stays on registry versions, as the released image will), and the staged tree's
own `Dockerfile` builds it — then runs two Docker stacks via
`release-test/docker-compose.yml`:

- **Upgrade lane** (ports 3210/5533/9310): seeds the currently released GHCR
  image through its setup wizard (sample protocol, synthetic interviews, data
  export), swaps the app container to the pending image against the live
  volumes so its `migrate-and-start.sh` migrations run on real data, verifies
  data integrity, dashboard CRUD, settings, and the interview data API, and
  diffs pre- vs post-upgrade exports (`release-test/scripts/diff-exports.mjs`)
  for unanticipated differences.
- **Fresh lane** (ports 3211/5534/9311): verifies the new-deployment setup
  process of the pending image end-to-end.

Harness scripts live in `apps/fresco/release-test/` (`build-image.sh`,
`up.sh --lane upgrade|fresh --image <ref> [--keep-data]`, `down.sh`,
`stage-fixture.sh` and `enable-captures.sh` for browser-driven uploads and
download capture via MinIO). `release-test/AGENT_NOTES.md` records the
verified techniques for driving Fresco in the in-app browser. The directory is
excluded from the public mirror. Storage is configured through the setup
wizard, not env vars, matching real bundled-MinIO deployments. Both stacks set
`DISABLE_ANALYTICS`, and a deployment with analytics disabled sends nothing
off-box from the browser: posthog-js is loaded only once the server has
confirmed analytics are on (`components/Providers/AnalyticsLoader.tsx` and
`lib/posthog-client.ts`), so there is no earlier window in which it could call
out. Both browser surfaces that can start analytics are read, because a
regression in either is invisible to the other — the fresh lane reads the
new-deployment dashboard, and the upgrade lane reads the participant-facing
interview route, which hands `@codaco/interview` its own client. Each reports
the hosts its tab contacted rather than requests to the relay's hostname, so
analytics repointed at any other ingestion host still fails, and each reports
its total log size as a positive control — a log that recorded nothing cannot
evidence silence. Any host outside the deployment fails the run.

Server-side capture is watched separately, because a browser network log
describes what the _page_ sent and is structurally blind to what the Fresco
_process_ sends. `lib/posthog-server.ts` returns on `isAnalyticsDisabled()`
before `getPostHogServer()` constructs the posthog-node client, so a disabled
deployment never builds one — and each stack proves that by aliasing the
relay's hostname onto a sink container (`relay-sink` in the compose file,
`release-test/scripts/relay-sink.mjs`) that records every connection it
receives. `release-test/scripts/relay-sink-check.mjs` reads that log, and any
connection fails the run.

Each connection is written down twice — once when it is accepted, once when it
has been classified — because classification cannot be immediate: a client that
stalls, or sends less than a full identifying prefix, is unknown until the
sink's timeout expires. A log written only at classification time is missing
everything accepted in that window, so the reader counts an
accepted-but-unclassified connection as egress. Nothing that has not identified
itself as a probe is read as one.

The sink also has to have been watching for the whole window it reports on.
`docker logs` succeeds against a container that has already exited, and the
probe records survive in it, so a sink inspected only once — before probing —
would report a clean, well-controlled reading of a stretch it spent dead. The
check inspects it again once the log is in hand and compares start times, which
brackets the check itself; the sink announces itself exactly once when it binds,
and requiring exactly one announcement covers everything the lane did before
that.

The governing rule for all of this is that **the log read is the last
observation the check makes**. Every reading describes an interval, and its
evidence comes from two samples taken at different moments — the inspections
and the log. Whenever the verified interval extends past the log snapshot, a
connection accepted in between is real, absent from the log, and reported as
silence. Reading the log last makes its coverage a superset of the verified
interval. Connections accepted between the final inspection and the read are
then counted conservatively as egress, which is the right direction to err.

The sink records connection attempts and never terminates TLS. posthog-node
speaks https, so parsing requests would mean minting a certificate for the
relay's name and trusting it inside the image under test — a container
configured differently from the one that ships, handed a relay that appears to
work. It would also buy nothing the gate uses: what it asks is whether the
container reached off-box for analytics at all, and a connection attempt
answers that completely while being recorded before any handshake can fail.
Its positive control is the same idea as `networkLogEntries`, one step
stronger: the check script dials the sink _from inside that lane's Fresco
container_, at the relay's real hostname, on every port the sink covers,
carrying a nonce it generated for that invocation — so a probe that comes back
recorded proves the whole path real egress would take. Without it, a sink that
never started reads exactly like a silent deployment. The app container and the
sink are removed together at the swap (`up.sh --keep-data`), so the log covers
the pending image's lifetime and never the released image's.

Read it for what it is. The run provokes `captureEvent`/`captureException`
heavily — `lib/activityFeed.ts` captures and flushes on every activity-feed
entry — so a zero is real evidence about the cached `isAnalyticsDisabled()`
guard. It is not evidence about the other one: `instrumentation.ts`'s
`onRequestError` and the process listeners consult
`isAnalyticsDisabledUncached()`, and neither is reachable on demand without
shipping an error-injection affordance in the image under test. Those are
covered by `lib/__tests__/instrumentation.test.ts` and
`lib/__tests__/posthog-server.test.ts`, which assert silence with analytics
disabled. What the sink adds over them is that any path which _does_ construct
the client and send is caught, whichever guard let it through.

### Reading the verdict

**Consume `releasable`, not `verdict`.** It is `true` only for a full-coverage
`go` run: the version was pinned with `expectedVersion` and matched, the
upgrade baseline was the real released image, the tree was clean, and no
pending changeset ships Fresco-facing behaviour the run never exercised.
Anything else is useful signal but not release evidence: `coverage` reads
`partial` and `coverageGaps` says why. Every exit returns the same fields,
including the early one taken when the build never completes.

```
/fresco-release-test  { expectedVersion: '4.1.2' }
```

`expectedVersion` is the version the Version Packages PR bumps Fresco to —
the one `bundle-pending-packages.mjs` bakes into the staged tree, and the one
both stacks must report from `/api/health`. Other args:
`skipBuild` (reuse the previous image, revalidated against its stamp),
`keepStack` (leave both stacks up), `releasedImage` (substitute the upgrade
baseline; never certifying), `allowDirty` (accept an irreproducible image
during development; never certifying).

The four verdicts are distinct on purpose:

| verdict      | meaning                                                                                        |
| ------------ | ---------------------------------------------------------------------------------------------- |
| `go`         | every check passed and the whole run is accounted for                                          |
| `no-go`      | the candidate failed something that gates a release                                            |
| `incomplete` | nothing failed, but part of the run could not be accounted for — it proves nothing either way  |
| `blocked`    | the released baseline could not be pulled, or no checklist agent reported — nothing was tested |

Findings are split by what they are evidence of, and the split is load-bearing:
`failures` are release-gating problems with the candidate; `unaccounted` are
problems with the run itself (a truncated checklist, an unexplained skip, a
dead judge, a claim no artifact supports); `warnings` are hygiene and
environment notes (leftover containers, an accepted dirty tree) that never flip
a verdict. `untestedShippedChanges` lists pending
changesets shipping Fresco-facing behaviour no check exercised — a statement
about the evidence rather than the build, so it caps certification through
`coverageGaps` instead of failing the run. Either extend the checklists to
cover them or read the list and decide. Every pending changeset has to be
classified as covered, untested or unrelated, and a library changeset counts
as Fresco-facing: the harness bundles the pending `@codaco/*` packages into
the image, so their behaviour ships inside the build under test.

The verdict is computed in the workflow, not by an agent. Every checklist
prompt numbers its items and synthesis binds the returned checks to that
numbering, so a truncated, reordered or quietly skipped report reads as
`incomplete` rather than coverage; only checks whose own text permits a skip
may be skipped, and only with a stated reason; an artifact-audit agent reports
what is actually on disk — the build stamp's own version, commit, image id and
dirty flag, the snapshot and archive files, and every file name the export diff
found differing — so no agent's claim about any of them is taken on its word,
and the export judge must classify every one of those files by name; and the
`release-critic` agent is a narrator and cross-checker whose judgment can only
make the verdict stricter. Regression tests for all of that
live in `scripts/fresco-release-test-workflow.test.mjs` and run offline under
`pnpm test:scripts` — they drive the workflow body with stub agents, so a
change that reopens a fail-open fails CI.

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
  - **Sync batching is Fresco's job, not the package's.** The engine offers a
    write for every change, because only the host knows what one costs — and
    here each one POSTs the whole network. The handler lives in
    `createInterviewSyncHandler.ts` and is wrapped in the package's
    `createDebouncedSyncHandler` at `SYNC_DEBOUNCE_MS`. Do not unwrap it:
    without it a request goes out per answer. The wrapper still writes
    immediately when the engine says a write cannot be deferred (the
    participant exiting or finishing, or the tab being hidden), so shortening
    the interval is a cost decision and never a correctness one. An
    `unloading` write — the tab being hidden or closed — additionally asks for
    `keepalive` when the body fits under the browser's 64KB cap.
  - **Two syncs for one interview can be in flight at once, and the server
    decides which one counts.** An `unloading` write is issued rather than
    queued, because a request waiting behind one that dies with the document
    would never run at all — so it can overlap an ordinary write and the two can
    finish in either order. The handler numbers each write it issues in
    `syncRevision`, counting up from the value the row held when the page
    rendered (`initialSyncRevision`, threaded through `mapInterviewPayload`),
    and the route applies a write only when its number is higher than the
    stored one. A write that lost its race is discarded instead of rolling the
    participant's answers back. The route reports the stored revision and the
    handler resumes from it, which is what stops a second tab — behind from the
    moment it loaded — from having everything it writes discarded. The client
    also aborts the request it supersedes, but that is only to save wasted work:
    aborting a fetch does not stop a handler the server has already started, so
    the ordering guarantee is the route's, not the client's. `syncRevision` is
    required: an upgrade takes the deployment down, so no browser is left
    running a bundle that does not send one, and there is no shape of request
    that reaches the row without an order to be judged in.
  - **A discarded write is not a saved one.** The route answers `applied: false`
    with the revision the row holds. The engine treats a resolved sync as
    durable and stops offering that state, so the handler may only resolve when
    a write covering it actually landed. It resolves when one of its own newer
    writes superseded this one — that write carries the same state, and
    rewriting the older snapshot is the rollback being guarded against — and
    otherwise rewrites once, numbered from the reported revision. Something that
    is not this tab moved the row, which in practice means a second tab open on
    the same interview. Overtaken again, it reports failure rather than claim a
    durability it did not achieve. A frozen interview is flagged as such rather
    than reported as a write that lost a race, because it declines every write
    permanently and rewriting would fail on every change from then on.
  - **The route bounds how far one write may advance the revision**
    (`MAX_REVISION_ADVANCE`). The endpoint is unauthenticated, so without it a
    single crafted request could park the row at the largest value the column
    holds and every genuine browser afterwards would overflow it and fail. The
    rewrite above is also what brings a counter that has drifted past the window
    — numbers burnt by writes that never landed — back inside it.

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
