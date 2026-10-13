#!/bin/bash
# Netlify build ignore script.
#
# Returning exit code 1 tells Netlify to proceed with the build; exit 0 tells
# Netlify to skip it. We require DATABASE_URL and DATABASE_URL_UNPOOLED to be
# present, because without them the production build runs `setup-database.ts`
# (and the deployed functions read `env.DATABASE_URL`) which fall back to
# PGHOST=localhost and crash against 127.0.0.1.
#
# For standard user deployments (per the deployment guide), both variables are
# configured in the Netlify dashboard before the first deploy, so this check
# passes and the build runs as normal.
#
# Our own fresco-next site sets both variables for production only. A pull
# request's deploy preview gets branch-scoped values from
# .github/workflows/fresco-preview-database.yml, which copies its base's
# database into a Neon branch for it. Until that has run — on the first push,
# or for a pull request that does not change Fresco — the preview has no
# database and this script skips it; the workflow triggers the build once the
# values exist.

set -u

if [ -z "${DATABASE_URL:-}" ] || [ -z "${DATABASE_URL_UNPOOLED:-}" ]; then
  echo "Skipping build: DATABASE_URL and/or DATABASE_URL_UNPOOLED not set for this context."
  echo "If this is a first-time deployment, set both variables in Netlify (Site configuration → Environment variables) and redeploy."
  exit 0
fi

exit 1
