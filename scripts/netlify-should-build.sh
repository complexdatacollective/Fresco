#!/bin/bash
# Netlify build ignore script.
#
# Returning exit code 1 tells Netlify to proceed with the build; exit 0 tells
# Netlify to skip it. We require DATABASE_URL and DATABASE_URL_UNPOOLED to be
# present, because without them the build runs `setup-database.ts` (and the
# deployed functions read `env.DATABASE_URL`) which fall back to PGHOST=localhost
# and crash against 127.0.0.1.
#
# For standard user deployments (per the deployment guide), both variables are
# configured in the Netlify dashboard before the first deploy, so this check
# passes and the build runs as normal.
#
# For our own PR deploy previews the same push that triggers Netlify's
# auto-deploy also kicks off `.github/workflows/netlify-deploy-preview.yml`,
# which sets the branch-scoped DB URLs and then triggers a fresh build via the
# Netlify API. The auto-deploy hits this script first, finds no branch env yet,
# and exits cheaply; the workflow-triggered build sees the env and proceeds.

set -u

if [ -z "${DATABASE_URL:-}" ] || [ -z "${DATABASE_URL_UNPOOLED:-}" ]; then
  echo "Skipping build: DATABASE_URL and/or DATABASE_URL_UNPOOLED not set for this context."
  echo "If this is a first-time deployment, set both variables in Netlify (Site configuration → Environment variables) and redeploy."
  exit 0
fi

exit 1
