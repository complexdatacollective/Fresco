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
   `.github/workflows/ci-and-release.yml` runs `scripts/release/mirror-app.mjs`, which
   replaces the Fresco repo's `main` with this app's source. Every
   `workspace:`/`catalog:` specifier is resolved to a registry version, and the
   single-package `pnpm-workspace.yaml` and lockfile the Dockerfile needs are
   generated.
3. That push to `main` triggers `.github/workflows/docker-publish.yml` **in the
   mirror**, which builds the container image and pushes it to GHCR tagged with
   the version and `latest`.

The lane is tag-driven and self-healing: `apps-release-detect` releases any
stable `package.json` version that has no `fresco@<version>` tag yet, so a
failed or dropped mirror is retried by the next push to main. Because pushes to
main run concurrently, three guards keep that retry from ever moving the mirror
backwards — the mirror is a linear append whose newest push becomes `latest`:

- `apps-release-fresco` holds one concurrency group for the app (not one per
  version), so two runs carrying different untagged versions serialise over
  the whole check → mirror → tag sequence.
- Under that lock it runs `.github/scripts/app-release-guard.sh`, which skips
  when the tag already exists, when the version is older than the newest
  `fresco@` tag, or when the tree does not contain the newest released commit.
  A run for a superseded main commit therefore skips with a warning and needs
  no follow-up; the newer release already covers it. (On 2026-09-02 the lane
  still had only a tag-exists check, and a run for an older main commit
  mirrored 4.1.3 on top of the 4.1.4 push.)
- The `release` job that publishes the `@codaco/*` packages stops if its
  commit is no longer main's tip (`.github/scripts/superseded-push-guard.sh`),
  runs one at a time, and when it holds the tip with nothing left to version
  it closes any Version Packages PR a superseded run regenerated.

The Version Packages PR itself must be current when it merges. If main gains a
normal-lane changeset after the PR head was generated, the merged tree carries
both the bumped versions and that changeset, and `changesets/action` regenerates
the PR instead of publishing — which is why 4.1.3 (and fresco-ui 6.3.0,
interview 9.0.1) never reached npm on 2026-09-01, and why this lane then failed
on every push until 4.1.4 shipped: the mirror's lockfile could not resolve
versions that did not exist. The `version-packages-freshness` job now refuses
such a merge from the queue; wait for the bot to regenerate the PR and queue
the new head.

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
  `scripts/release/mirror-app.mjs` still produces those files.
- Workspace packages are consumed from source here but from **npm dist** in the
  mirror. Code that only works under one bundler will pass locally and fail in
  the released image — see "Workers and bundler portability" below.

### PostHog source maps

Nothing in this repository builds the bundle the released image serves, so the
`Dockerfile`'s build is the only place Fresco's source maps can be uploaded
from: PostHog resolves a frame by matching the chunk ID baked into the bundle
against an uploaded map, and no other build's chunk IDs match the image's. That
is unlike Architect, Interviewer, Documentation and the Website, which are each
built and deployed by a job in `.github/workflows/ci-and-release.yml` that
passes `POSTHOG_PERSONAL_API_KEY` and `POSTHOG_PROJECT_ID` to the build step
(`scripts/ci/ci-workflow.test.mjs` keeps those jobs wired).

The `Dockerfile` therefore takes the credentials as two optional BuildKit
secrets, `posthog_personal_api_key` and `posthog_project_id` — secrets rather
than `ARG`/`ENV` so the key never lands in the image's layer history. Supply
both and the build uploads its maps and deletes them from the output; supply
neither and the build is byte-identical to one from before they existed.
`apps/fresco/__tests__/sourceMapUpload.test.ts` guards both arms.

The publisher workflow, `apps/fresco/.github/workflows/docker-publish.yml`,
passes both as `secrets:` on its `docker/build-push-action` step. It is
source-controlled here and the mirror carries it to the Fresco repository, so
the whole chain lives in this repo: turbo keeps the credentials in the cache
key, `next.config.ts` gates on them, the `Dockerfile` mounts them, and the
publisher supplies them. Remove any one link and the other three change nothing,
which is why the guard test covers all four.

Two things this still depends on, neither of them a code change:

- **`POSTHOG_PERSONAL_API_KEY` and `POSTHOG_PROJECT_ID` must exist as secrets on
  the `complexdatacollective/Fresco` repository**, because that is where the
  publisher runs. While they are absent the expressions expand to empty, the
  `-s` test in the Dockerfile fails, and the build emits no maps — the same
  behaviour as before, just silently. There is no error to notice, so if Fresco
  frames are still minified after a release, check these first.
- **A publisher change must be pre-applied to the Fresco repository before the
  next release.** `assertFrescoPublisherContract` in
  `scripts/release/mirror-app.mjs` refuses to mirror unless the external copy is
  already byte-identical, because the release token deliberately cannot modify
  workflows. So editing this file here **blocks the next Fresco release** until a
  maintainer credential applies the identical diff over there. Sequence it that
  way round, or the release lane fails with "must already match the monorepo
  copy".

Netlify's `fresco-next` and `fresco-sandbox` deploys are built by Netlify rather
than by this publisher, so they upload only if those two variables are also set
on the Netlify site.

## Deploy previews and their databases

The `fresco-next` Netlify site (fresco-sandbox.networkcanvas.dev) is the
sandbox for `main`. Its `DATABASE_URL` and `DATABASE_URL_UNPOOLED` are set for
**production only**; a deploy preview never sees that database. On 12 Oct 2026
previews still shared it, and every build of the `schema-9` preview migrated
the sandbox's protocols and interviews to schema 9, which main refuses to run,
so every interview link on the sandbox failed.

Each pull request that changes Fresco gets its own database instead, from
`.github/workflows/fresco-preview-database.yml`
(`scripts/ci/fresco-preview-database.mjs`): a Neon branch, in the
`fresco-sandbox-dev` project, copied from the database of the pull request's
**base**. A pull request into `main` copies main's database (the project's
default branch); one into `schema-9` copies `preview/schema-9`, so stacked pull
requests stack their databases. The branch is named `preview/<git branch>`,
created when the pull request opens, kept across pushes, replaced when the
pull request is retargeted, and deleted when it closes (unless another
preview is still copied from it). Its connection strings and a
`PREVIEW_DATABASE_BRANCH` marker are set as Netlify values scoped to that git
branch.
Netlify scopes values to a git branch, not to a pull request, so pull requests
that share a head branch share one database: while more than one is open,
none of them replaces or removes it. A pull request that stops changing
Fresco, or is retargeted onto a base that has no preview database, loses its
copy. When a branch's database is created, the open pull requests into that
branch that found nothing to copy are provisioned in the same run.

The workflow builds a newly provisioned preview itself, because Netlify
skipped the build for that push. Netlify has no call that re-runs a skipped
Deploy Preview, so that first build is a branch deploy
(`<branch>--fresco-next.netlify.app`); later pushes build the pull request's
Deploy Preview as usual. Both read the same database.

Previews and branch deploys build with `build:preview`
(`scripts/build-preview.ts`). It runs the full `build:platform`, migrations
included, only when `PREVIEW_DATABASE_BRANCH` is `preview/<the branch being
built>`; otherwise it builds without touching the database. A self-hosted
deployment whose previews share its production database therefore never
migrates it from a preview. A pull request into a branch that has no preview
database gets none, and its preview is skipped by `netlify-should-build.sh`.

## Hotfix releases (when main is ahead)

The normal lane always mirrors `main`, so it can only ship a patch together
with everything else merged since the last release. When main carries work
that is not ready to go out, release from the previous tag instead. The
procedure is the one in `apps/interviewer/RELEASING.md`, with one difference
that follows from how Fresco ships: the image installs the published
`@codaco/*` packages, not workspace source, so a library fix cherry-picked onto
the hotfix branch would never reach the image on its own. The lane therefore
mirrors the branch with every workspace package in Fresco's dependency closure
whose built artifact would differ from the release tag's — its own source
changed, a catalog entry it consumes was re-pinned, a shared build input
such as a tsconfig changed, or anything its resolution reaches in the root
lockfile moved, a compiler's own dependency included — and every closure
package that depends on one,
packed into `vendor/` as tarballs, with pnpm overrides that
resolve every range onto them (`scripts/release/mirror-app.mjs --vendor-changed-since`,
built on `scripts/release/vendor-workspace-packages.mjs`, the same mechanism the
release test uses). Nothing is published to npm. The packages the hotfix did
not touch install at the exact registry versions the released image used: the
lane seeds the mirror's lockfile and its generated workspace policy from the
ones the Fresco repository holds at that release before resolving (bringing
only the policy's catalog-backed overrides, such as `postcss`, to the branch's
catalog), so only the vendored packages and the bumped app version are
re-resolved, and neither a
library or third-party version published after the release nor a dependency
policy change that exists only on main can slip in. The corollary: a
dependency fix that lives only in the branch's own `pnpm-lock.yaml`, or only
in the root `pnpm-workspace.yaml` outside its catalog (an `overrides` entry,
say), cannot reach the image, and the lane refuses such a branch — pin the
fixed version in the affected manifest, or re-pin a catalog entry that package
consumes, so it becomes a specifier change the mirror carries. After resolving,
the lane also checks that every resolution the branch changed for a package the
image installs is present in the mirror's lockfile, so one legitimate
dependency change cannot mask another that only the branch's lockfile carried.

1. Cut the branch from the released tag and cherry-pick the fix:

   ```bash
   git switch -c hotfix/fresco-<version> 'fresco@<previous>'
   git cherry-pick <sha>
   ```

   Land the same fix on main through the usual pull request as well — the
   hotfix branch is a delivery vehicle, not the source of truth.

2. Bump `apps/fresco/package.json` to the hotfix version and add the matching
   `## <version>` section to `apps/fresco/CHANGELOG.md`; `scripts/release/release-notes.mjs`
   reads that section for both GitHub releases. Do **not** run
   `changeset version` on the branch.
3. Push the branch and open its merge-back pull request into `main` now. Then
   certify it with the release test — using **main's** tooling, never the
   branch's own: a branch cut from an older tag carries the release-test
   harness and mirror scripts as they were then, which would stage a different
   image from the one the lane ships (the lane itself always runs main's copy
   from `.hotfix-lane`). Take the current tooling onto the branch first; none
   of it is part of the release — `release-test/` is excluded from the mirror,
   and `scripts/` and `.claude/` are never mirrored:

   ```bash
   git checkout main -- scripts apps/fresco/release-test .claude/workflows/fresco-release-test.js
   git commit -m 'chore(fresco): refresh release tooling from main for certification'
   VENDOR_CHANGED_SINCE='fresco@<previous>' bash apps/fresco/release-test/build-image.sh
   ```

   `VENDOR_CHANGED_SINCE` makes the build stage the tree exactly as the lane
   does — vendoring what changed since that tag, seeding the lockfile from the
   released mirror — instead of bundling the pending changesets. Then run
   `/fresco-release-test` with `{ expectedVersion: "<version>", skipBuild: true }`
   from that checkout. Proceed only on a full-coverage "go" with `releasable: true`.

4. Run the **Hotfix Release** workflow **from main**, with `app: fresco` and
   `source_ref` set to the hotfix branch. Its first job runs typecheck and
   tests across Fresco's whole workspace dependency closure, builds the
   closure so the changed packages can be packed, and stages the vendored
   mirror tree. A second job, `fresco-publish`, re-validates the version,
   claims `fresco@<version>`, pushes that tree to the Fresco repository's
   `main` — which is what triggers the GHCR image build, exactly as a normal
   release does — and creates the release on both repositories. The split is
   deliberate: staging runs code from the hotfix branch (`pnpm pack` runs each
   vendored package's lifecycle scripts, which could also plant a fake `gh` on
   that job's `$GITHUB_PATH`), so the job that does it holds no credential at
   all, and the job that holds the tag-claiming token and the push token runs
   nothing from the branch. A protected `fresco-hotfix-production` environment
   therefore asks for approval twice.
   The GHCR publisher workflow the mirror carries is main's copy, not the
   branch's (a branch cut from an older tag may predate a publisher change
   already pre-applied to the Fresco repository). Both jobs check that the
   staged tree carries exactly that workflow and that the Fresco repository
   tracks exactly it — the publish job immediately before copying, so nothing
   a lifecycle script left under `.github/workflows` can be pushed.
   The lane holds the normal lane's `apps-release-fresco` lock, re-checks the
   newest tag after building, and refuses a version older than the current
   release, because the mirror's newest push is what `latest` points at. It
   also reads the version the Fresco repository's `main` carries and refuses
   while that is ahead of the tags here: the normal lane pushes the mirror
   before it tags, so a run that failed between the two left a release the
   tags do not record, which a hotfix cut from the newest tag would append
   older code over. Re-run the normal lane for `main` (it re-mirrors and
   tags) or tag `fresco@<version>` on the commit that produced it, then
   re-dispatch. As
   in the normal lane, the push is what starts the Fresco repository's image
   build, and neither lane waits for it: if that build fails, re-run it from
   the Fresco repository's Actions tab against the same mirrored commit — the
   tag and releases already describe that commit, so nothing here needs
   re-dispatching.
5. **Merge the hotfix branch into main** with a merge commit, never a squash,
   after the tag exists: `.github/scripts/app-release-guard.sh` skips main's
   Fresco release until main contains the released commit. Then remove only
   `'fresco'` from the changeset the hotfix consumed, deleting the file only if
   Fresco was its sole target.

The `fresco-hotfix-production` environment needs the same one-time protection
the Interviewer lane documents (required reviewers, deployment branches
restricted to `main`); until that is configured, the dispatch itself is the
only gate. `LEGACY_RELEASE_GH_TOKEN` is the token the mirror pushes with.

## Release testing

Before a Fresco release is approved (the Version Packages PR merged), the
pending state of `main` can be release-tested locally with the
`/fresco-release-test` Claude workflow (`.claude/workflows/fresco-release-test.js`;
Codex: run the harness scripts below manually). It builds the pending image the
way a release would — `scripts/release/mirror-app.mjs` stages the mirrored tree,
`release-test/scripts/bundle-pending-packages.mjs` swaps the registry
resolutions of exactly the `@codaco/*` packages the pending release will
publish — those the changesets bump, plus any whose current version npm does
not have, which `changeset publish` publishes regardless — for tarballs packed
from the pending source (the rest of the closure stays on registry versions, as
the released image will), and the staged tree's own `Dockerfile` builds it —
then runs two Docker stacks via
`release-test/docker-compose.yml`:

- **Upgrade lane** (ports 3210/5533/9310): seeds the currently released GHCR
  image through its setup wizard (sample protocol, synthetic interviews, data
  export), swaps the app container to the pending image against the live
  volumes so its `migrate-and-start.sh` migrations run on real data, verifies
  data integrity, dashboard CRUD, settings, and the interview data API, and
  diffs pre- vs post-upgrade exports (`release-test/scripts/diff-exports.mjs`)
  for unanticipated differences.
- **Fresh lane** (ports 3211/5534/9311): verifies the new-deployment setup
  process of the pending image end-to-end, and then runs the script-driven
  checks on that instance — a whole interview conducted from the first stage to
  the finish screen and out through an export, what `/api/health` tells an
  anonymous caller, and the researcher interface in another language.
- **Analytics lane** (ports 3212/5535/9312): the one deployment in the run with
  analytics **enabled**, against a sink that terminates TLS and records every
  request. It also imports the damaged protocol fixtures, because "opening a
  damaged file is no longer recorded as an application error" is a claim about
  what is sent.
- **Two-factor lane** (ports 3213/5536/9313): a deployment that sets
  `REQUIRE_TWO_FACTOR`.

Both configured lanes are started and torn down around their own checks, so a
run holds four stacks only as long as it has to.

#### The script-driven lanes

Those last three lanes are driven by deterministic scripts under
`release-test/scripts/` rather than by an agent reading a checklist:
`interview-lane.mjs`, `health-lane.mjs`, `localization-lane.mjs`,
`analytics-lane.mjs` and `two-factor-lane.mjs`, over a shared Playwright driver
(`fresco-driver.mjs`) and a lane table (`lanes.mjs`) that
`scripts/release-test/fresco-release-test-workflow.test.mjs` binds to `up.sh`.
What they check has a fixed answer — which payload was sent, which page was
served, whether a request was refused — and an assertion in code is the same
assertion on every run, can be made to fail on purpose in CI, and does not
spend a model's attention rediscovering how to click a wizard. The agent that
runs one is a courier: it runs the script and returns its JSON verbatim.

Each script prints one line of `{ ok, checks: [{ id, status, detail }] }`, and
the workflow holds every lane to the exact SET of check ids it expects
(`expectedScriptChecks`). A missing id is a check that stopped running, an
unknown one is a report the workflow cannot account for, and both fail the run
rather than reading as coverage. `up.sh` reports the deployment configuration
it started each lane in (`analytics`, `requireTwoFactor`) and the workflow
refuses a lane that came up as the wrong deployment — an analytics lane with
analytics disabled would send nothing at all, and every payload assertion in it
would pass over an empty file.

The judgment in those lanes lives in pure modules —
`relay-payload-protocol.mjs` (what an enabled deployment may send),
`localization-contract.mjs` (whether a page actually changed language) and
`interview-export-contract.mjs` (whether an export carries the answers that
were given) — so each oracle is exercised on synthetic input in
`scripts/release-test/fresco-release-test-lane-contracts.test.mjs`, where it is
also shown failing on input that breaks the behaviour it guards. Lists those
contracts are written against are bound to the application's own: the element
events and properties to `lib/posthog-client.ts`, the entity-id properties to
`@codaco/interview`, and the import-failure vocabulary to
`@codaco/protocol-validation`.

The protocol fixtures are built rather than committed
(`release-test/scripts/make-fixtures.mjs`, from
`packages/protocols/e2e/fresco-release-test`): the protocol an interview is
conducted with, and the damaged ones — a missing resource, a damaged archive, a
protocol that inflates past the shared limit, and the pair of filters that
shows a fractional comparison value accepted and a fractional COUNT refused. A
repository is the wrong place for a deliberately corrupt archive and an entry
that expands to more than a gigabyte.

Harness scripts live in `apps/fresco/release-test/` (`build-image.sh`,
`up.sh --lane upgrade|fresh|analytics|twofactor --image <ref> [--keep-data]`,
`down.sh`,
`stage-fixture.sh` and `enable-captures.sh` for browser-driven uploads and
download capture through presigned URLs into the lane's Garage). `release-test/AGENT_NOTES.md` records the
verified techniques for driving Fresco in the in-app browser. The directory is
excluded from the public mirror. Storage is configured through the compose
file's `STORAGE_PROVIDER`/`S3_*` env vars, matching real bundled-Garage
deployments, so the setup wizard's storage step is locked. Every stack but
the analytics lane sets
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
work. (The analytics lane does exactly that, deliberately and only there: its
sink terminates TLS with a certificate `up.sh` mints for the run and that
lane's container sets `NODE_TLS_REJECT_UNAUTHORIZED=0`, because the question
that lane asks can only be answered by reading the payloads. It changes whether
the container VERIFIES the relay, never what it sends — and no lane that
asserts silence sets it.) It would also buy nothing the gate uses: what it asks is whether the
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
the one `bundle-pending-packages.mjs` bakes into the staged tree and the one
the build stamp records. Run from the Version Packages branch itself — HEAD is
the commit origin's `changeset-release/main` points at now (read with
`git ls-remote`, so not a possibly stale local tracking ref), under that branch
name or any other, as in a detached worktree — and it can be omitted: the
workflow infers it from the Fresco version that branch carries
(`release-test/scripts/release-branch-version.mjs`), provided the branch
contains `origin/main`'s tip (which must match origin's `main`) and moves
Fresco's version past it as stable semver. A checkout that looks like the
release branch (named `changeset-release/main`, or at the local tracking ref)
but is not origin's current head, an unreachable origin, a PR that does not
contain main's tip (wait for the bot to regenerate it), a downgrade, or a
version that is not stable semver leaves the run unpinned rather than inferring
anything. So does any other checkout that deleted normal-lane changesets since
it left `origin/main`, as only a Version Packages head does: a detached or
renamed checkout of a superseded PR head keeps neither the branch name nor the
tracking ref, so what it consumed is what identifies it. So does an origin that is not the canonical
`complexdatacollective/network-canvas-monorepo` on github.com (after any
`insteadOf` rewriting), since nothing it says identifies the Version Packages
PR. The release branch has already consumed (deleted) the changesets it ships,
so the script also names every changeset it deleted relative to main's tip;
the diff judge, audit and critic read them from that commit, and the coverage
gates count them as pending. A branch that consumed none, or that still
carries a changeset the normal lane owns (the merge-time freshness guard's
predicate: a stale PR updated by merging main rather than regenerated), or that
deleted a changeset a separately gated lane (Documentation, Website, Studio)
still needs, pins nothing. Neither does a Fresco version the app-release guard
would skip: one whose `fresco@` tag already exists on origin, one not newer
than origin's newest `fresco@` tag, or a branch that does not contain that
tag's commit (an unmerged hotfix; merge it into main and wait for the PR to
regenerate). The branch is checked on every run, pinned or not, and a run from
it is bound to it either way: the image must be built from the branch head, a
passed `expectedVersion` must equal the version the branch carries, the branch
must release Fresco, and its consumed changesets are counted. Because the bot regenerates the PR whenever
main moves, the branch is checked again after the lanes finish; if its head,
version or consumed changesets changed, or the check fails, the run is
`incomplete`. A pinned run whose checkout cannot be identified (the check
failed, or origin is not the canonical repository) is also `incomplete`,
since changesets it may have consumed would go uncounted.
`expectedVersionSource` reports where the version came from (`args`,
`release-branch`, or `null` when unpinned). Each lane is bound to that build by the image id
docker reports for its Fresco container (`/api/health` names no version, on
purpose). Other args:
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
classified as covered, untested, unrelated or presentation-only, and a library
changeset counts as Fresco-facing: the harness bundles the pending `@codaco/*`
packages into the image, so their behaviour ships inside the build under test.

`presentationOnlyChanges` is the fourth classification and the only one that
takes a changeset out of the coverage tally without a check having run: a
changeset whose entire Fresco-facing content is `@codaco/fresco-ui` component
behaviour — how a field, a dialog or a picker looks and behaves in isolation —
which its own Storybook interaction tests verify on every change to it. A
release test that drives whole deployments is the wrong instrument for it, and
counting those as untested only inflated the number until it stopped being
read. The claim is checked rather than accepted: the artifact audit reports the
packages each changeset bumps, and a changeset that also bumps `fresco`,
`@codaco/interview`, `@codaco/protocol-validation`, `@codaco/network-exporters`,
`@codaco/shared-consts` or `@codaco/app-i18n` — or any package the workflow has
not classified — cannot be set aside.

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
live in `scripts/release-test/fresco-release-test-workflow.test.mjs` and run offline under
`pnpm test:scripts` — they drive the workflow body with stub agents, so a
change that reopens a fail-open fails CI.

## Commands

```bash
pnpm --filter fresco dev          # Postgres + Garage via Docker, then next dev
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
