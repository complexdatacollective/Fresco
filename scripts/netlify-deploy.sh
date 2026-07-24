#!/usr/bin/env bash
# Trigger a Netlify build for $BRANCH and wait for it to reach a terminal
# state. Exits 0 on success, non-zero on failure or timeout.
#
# Netlify resolves the deploy context (production / branch-deploy /
# deploy-preview) from $BRANCH against the site's branch configuration —
# the API call is the same either way.
#
# Required env: NETLIFY_AUTH_TOKEN, NETLIFY_SITE_ID, BRANCH
# Optional env:
#   CLEAR_CACHE              — true|false (default false)
#   POLL_INTERVAL_SECONDS    — default 15
#   POLL_TIMEOUT_SECONDS     — default 1800 (30 min)

set -euo pipefail

: "${NETLIFY_AUTH_TOKEN:?NETLIFY_AUTH_TOKEN is required}"
: "${NETLIFY_SITE_ID:?NETLIFY_SITE_ID is required}"
: "${BRANCH:?BRANCH is required}"

CLEAR_CACHE="${CLEAR_CACHE:-false}"
POLL_INTERVAL_SECONDS="${POLL_INTERVAL_SECONDS:-15}"
POLL_TIMEOUT_SECONDS="${POLL_TIMEOUT_SECONDS:-1800}"

api() {
  curl --silent --show-error --fail \
    -H "Authorization: Bearer $NETLIFY_AUTH_TOKEN" \
    "$@"
}

echo "Triggering Netlify build for branch: $BRANCH (clear_cache=$CLEAR_CACHE)"

TRIGGER_RESPONSE=$(api -X POST \
  -H "Content-Type: application/json" \
  -d "{\"branch\":\"$BRANCH\",\"clear_cache\":$CLEAR_CACHE}" \
  "https://api.netlify.com/api/v1/sites/$NETLIFY_SITE_ID/builds")

DEPLOY_ID=$(echo "$TRIGGER_RESPONSE" | jq -r '.deploy_id // empty')
if [ -z "$DEPLOY_ID" ]; then
  echo "Failed to extract deploy_id from trigger response:" >&2
  echo "$TRIGGER_RESPONSE" >&2
  exit 1
fi

echo "Triggered deploy: $DEPLOY_ID"
echo "Polling every ${POLL_INTERVAL_SECONDS}s (timeout: ${POLL_TIMEOUT_SECONDS}s)..."

elapsed=0
while [ "$elapsed" -lt "$POLL_TIMEOUT_SECONDS" ]; do
  DEPLOY=$(api "https://api.netlify.com/api/v1/sites/$NETLIFY_SITE_ID/deploys/$DEPLOY_ID")
  STATE=$(echo "$DEPLOY" | jq -r '.state // "unknown"')

  case "$STATE" in
    ready)
      URL=$(echo "$DEPLOY" | jq -r '.deploy_ssl_url // .ssl_url // .deploy_url // empty')
      echo "Deploy succeeded: $URL"
      exit 0
      ;;
    error | failed | rejected | skipped | canceled)
      ERROR_MSG=$(echo "$DEPLOY" | jq -r '.error_message // empty')
      echo "Deploy failed with state: $STATE" >&2
      [ -n "$ERROR_MSG" ] && echo "Error: $ERROR_MSG" >&2
      LOG_URL="https://app.netlify.com/sites/$NETLIFY_SITE_ID/deploys/$DEPLOY_ID"
      echo "Build logs: $LOG_URL" >&2
      exit 1
      ;;
    *)
      echo "  [${elapsed}s] state=$STATE"
      ;;
  esac

  sleep "$POLL_INTERVAL_SECONDS"
  elapsed=$((elapsed + POLL_INTERVAL_SECONDS))
done

echo "Timeout after ${POLL_TIMEOUT_SECONDS}s waiting for deploy $DEPLOY_ID" >&2
exit 1
