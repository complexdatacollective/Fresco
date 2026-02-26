# Netlify Branch Deploys Implementation Plan

**Goal:** Switch deploy previews from CLI-based draft deploys to true Netlify branch deploys, while keeping Neon database branching for per-PR isolation.

**Architecture:** Netlify's native CI auto-builds branch deploys on git push (using a simplified build command). GitHub Actions handles Neon branch creation, migrations, initialization, and branch-scoped env var injection in parallel.

**Tech Stack:** GitHub Actions, Netlify CLI, Neon, Prisma

---

## Context

**Design doc date:** 2026-02-26

**Problem:** `netlify deploy` (without `--prod`) creates draft/preview deploys. True branch deploys require Netlify's own CI to build and deploy.

**Key insight:** Database URLs are only needed at runtime (serverless functions), not build time. Migrations and initialization run in GHA. `SKIP_ENV_VALIDATION=true` bypasses `env.js` validation during the Netlify build. Netlify's native auto-builds handle branch deploys — no build hook needed.

## Changes

### `package.json`

New script: `"build:branch-preview": "SKIP_ENV_VALIDATION=true prisma generate && next build"`

### `netlify.toml`

Added `[context.branch-deploy]` with `command = "pnpm build:branch-preview"`

### `.github/workflows/netlify-deploy-preview.yml`

- Removed: `netlify deploy` CLI step
- Added: `Run Initialization` step (previously inside `build:platform`)
- No build hook — Netlify auto-builds on git push
- PR comment uses predictable branch deploy URL with `NETLIFY_SITE_NAME` variable

### Manual Netlify Configuration

1. Branch deploys: Set to "All branches"
2. Builds: Keep active (Netlify auto-builds on push)
3. Add GitHub variable: `NETLIFY_SITE_NAME`

## Key Decisions

- **No build hook** — Netlify's native auto-builds handle branch deploys on git push
- **`SKIP_ENV_VALIDATION`** used during branch-deploy builds since DATABASE_URL is only needed at runtime
- Migrations run in GHA (not Netlify CI) because GHA creates the Neon branch and has the connection URLs
- `NETLIFY_BUILD_HOOK_URL` secret is no longer needed
