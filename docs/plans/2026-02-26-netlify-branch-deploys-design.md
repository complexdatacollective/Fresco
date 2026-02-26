# Netlify Branch Deploys Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Switch deploy previews from CLI-based draft deploys to true Netlify branch deploys triggered via build hooks, while keeping Neon database branching for per-PR isolation.

**Architecture:** GitHub Actions handles Neon branch creation, migrations, initialization, and branch-scoped env var injection, then triggers Netlify's CI via a build hook. Netlify clones the PR branch and builds with a simplified command that skips DB setup.

**Tech Stack:** GitHub Actions, Netlify CLI, Netlify Build Hooks, Neon, Prisma

---

## Context

**Design doc date:** 2026-02-26

**Problem:** `netlify deploy` (without `--prod`) creates draft/preview deploys. True branch deploys require Netlify's own CI to build and deploy.

**Key insight:** Database URLs are only needed at runtime (serverless functions), not build time. Migrations and initialization run in GHA before the Netlify build starts. `SKIP_ENV_VALIDATION=true` bypasses `env.js` validation during the build.

---

### Task 1: Add `build:branch-preview` script to `package.json`

**Files:**
- Modify: `package.json:9` (scripts section)

**Step 1: Add the new script**

In `package.json`, add a `build:branch-preview` script after the existing `build:platform` script:

```json
"build:branch-preview": "SKIP_ENV_VALIDATION=true prisma generate && next build",
```

This skips DB setup (`setup-database.ts` and `initialize.ts`) and env validation. `prisma generate` is still needed because it generates TypeScript types consumed by `next build`.

**Step 2: Verify script is valid**

Run: `pnpm run build:branch-preview --help 2>&1 | head -5`

This just confirms pnpm recognizes the script. Don't actually run the build (no DB available locally for a full build).

**Step 3: Commit**

```bash
git add package.json
git commit -m "add build:branch-preview script for Netlify branch deploys"
```

---

### Task 2: Add branch-deploy context to `netlify.toml`

**Files:**
- Modify: `netlify.toml`

**Step 1: Add the branch-deploy context**

The current `netlify.toml` is:

```toml
[build]
  publish = ".next"
  command = "pnpm build:platform"
```

Add the branch-deploy context so the full file becomes:

```toml
[build]
  publish = ".next"
  command = "pnpm build:platform"

[context.branch-deploy]
  command = "pnpm build:branch-preview"
```

This tells Netlify to use the simplified build command for branch deploys while keeping `build:platform` (with migrations) for production deploys.

**Step 2: Commit**

```bash
git add netlify.toml
git commit -m "add branch-deploy build context to netlify.toml"
```

---

### Task 3: Rewrite the deploy preview GitHub Actions workflow

**Files:**
- Modify: `.github/workflows/netlify-deploy-preview.yml`

**Step 1: Replace the workflow**

Replace the entire contents of `.github/workflows/netlify-deploy-preview.yml` with:

```yaml
name: Deploy Preview

on:
  pull_request:

permissions:
  contents: read
  pull-requests: write

jobs:
  deploy-preview:
    runs-on: ubuntu-latest
    env:
      NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
      NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
    steps:
      - name: Get branch name
        id: branch-name
        uses: tj-actions/branch-names@v9

      - name: Create Neon Branch
        id: create-branch
        uses: neondatabase/create-branch-action@v6
        with:
          project_id: ${{ vars.NEON_PROJECT_ID }}
          branch_name: preview/pr-${{ github.event.number }}-${{ steps.branch-name.outputs.current_branch }}
          api_key: ${{ secrets.NEON_API_KEY }}

      - name: Setup
        uses: complexdatacollective/github-actions/setup-pnpm@v1

      - name: Install Netlify CLI
        run: pnpm add -g netlify-cli

      - name: Write .env file
        env:
          NEON_DB_URL: ${{ steps.create-branch.outputs.db_url }}
          NEON_DB_URL_POOLED: ${{ steps.create-branch.outputs.db_url_pooled }}
        run: |
          # Pull down the environment variables for the deploy-preview context
          netlify env:list --context deploy-preview --plain >> .env
          # Add the database connection URLs to the .env file
          echo "DATABASE_URL_UNPOOLED=$NEON_DB_URL" >> .env
          echo "DATABASE_URL=$NEON_DB_URL_POOLED" >> .env

      - name: Run Migrations
        run: npx tsx scripts/setup-database.ts

      - name: Run Initialization
        run: npx tsx scripts/initialize.ts

      - name: Set Netlify runtime environment variables
        run: |
          netlify env:set DATABASE_URL "${{ steps.create-branch.outputs.db_url_pooled }}" --context "branch:${{ steps.branch-name.outputs.current_branch }}"
          netlify env:set DATABASE_URL_UNPOOLED "${{ steps.create-branch.outputs.db_url }}" --context "branch:${{ steps.branch-name.outputs.current_branch }}"

      - name: Trigger Netlify Branch Deploy
        run: |
          curl -X POST -d '{}' "${{ secrets.NETLIFY_BUILD_HOOK_URL }}?trigger_branch=${{ steps.branch-name.outputs.current_branch }}&trigger_title=PR+%23${{ github.event.number }}+branch+deploy"

      - name: Comment on Pull Request
        uses: thollander/actions-comment-pull-request@v2
        with:
          message: |
            | Resource | Link |
            |----------|------|
            | Netlify Preview 🚀 | https://${{ steps.branch-name.outputs.current_branch }}--${{ vars.NETLIFY_SITE_NAME }}.netlify.app |
            | Neon branch 🐘 | https://console.neon.tech/app/projects/${{ vars.NEON_PROJECT_ID }}/branches/${{ steps.create-branch.outputs.branch_id }} |
```

**Key changes from the original:**
- Removed: `netlify deploy` CLI step and JSON parsing
- Added: `Run Initialization` step (was previously inside `build:platform` on Netlify)
- Added: `Trigger Netlify Branch Deploy` step using build hook `curl`
- Changed: PR comment uses predictable branch deploy URL pattern with `NETLIFY_SITE_NAME` variable
- New secret needed: `NETLIFY_BUILD_HOOK_URL`
- New variable needed: `NETLIFY_SITE_NAME` (the Netlify subdomain, e.g. `my-site` from `my-site.netlify.app`)

**Step 2: Commit**

```bash
git add .github/workflows/netlify-deploy-preview.yml
git commit -m "switch deploy preview to Netlify build hook for true branch deploys"
```

---

### Task 4: Manual Netlify Configuration

This task cannot be automated — it requires changes in the Netlify UI.

**Step 1: Configure branch deploys**

Go to: Site configuration > Build & deploy > Continuous deployment > Branches and deploy contexts

Set branch deploys to **"All branches"**.

**Step 2: Disable auto-builds on git push**

Go to: Site configuration > Build & deploy > Continuous deployment > Build settings

Set "Builds" to **"Stopped"** (or disable "Build on push" if available as a separate toggle).

This prevents double builds: git pushes won't auto-trigger builds, only the build hook from GHA will.

**Step 3: Create a build hook**

Go to: Site configuration > Build & deploy > Continuous deployment > Build hooks

Create a new build hook (name it something like "GHA Deploy Preview"). Copy the URL.

**Step 4: Add GitHub secrets and variables**

In the GitHub repo settings (Settings > Secrets and variables > Actions):

- Add secret: `NETLIFY_BUILD_HOOK_URL` = the build hook URL from step 3
- Add variable: `NETLIFY_SITE_NAME` = your Netlify site subdomain (e.g. `fresco` if your site is `fresco.netlify.app`)

---

## Verification

After all tasks are complete:

1. Push a branch and open a PR
2. Verify GHA workflow runs: creates Neon branch, runs migrations, sets env vars, triggers build hook
3. Verify Netlify builds the branch (check Netlify dashboard — should show as "Branch deploy", not "Deploy Preview")
4. Verify the predictable URL works: `https://<branch>--<site>.netlify.app`
5. Verify the app connects to the correct Neon database branch at runtime
6. Close the PR and verify cleanup workflow deletes the Neon branch and env vars
