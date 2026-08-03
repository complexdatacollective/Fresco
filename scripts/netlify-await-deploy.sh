#!/usr/bin/env bash
# Wait for the Netlify production deploy associated with $COMMIT_SHA to
# reach a terminal state. Exits 0 if the deploy reaches `ready`, non-zero
# on error/failed/rejected/skipped/canceled or timeout.
#
# Two phases: first poll the deploys list until a deploy with matching
# commit_ref appears (handles Netlify queue latency between push and deploy
# creation), then poll that deploy's state.
#
# Required env: NETLIFY_AUTH_TOKEN, NETLIFY_SITE_ID, COMMIT_SHA
# Optional env:
#   POLL_INTERVAL_SECONDS       — default 15
#   POLL_TIMEOUT_SECONDS        — default 1800 (30 min)
#   DISCOVERY_TIMEOUT_SECONDS   — default 300 (5 min)

set -euo pipefail

: "${NETLIFY_AUTH_TOKEN:?NETLIFY_AUTH_TOKEN is required}"
: "${NETLIFY_SITE_ID:?NETLIFY_SITE_ID is required}"
: "${COMMIT_SHA:?COMMIT_SHA is required}"

POLL_INTERVAL_SECONDS="${POLL_INTERVAL_SECONDS:-15}"
POLL_TIMEOUT_SECONDS="${POLL_TIMEOUT_SECONDS:-1800}"
DISCOVERY_TIMEOUT_SECONDS="${DISCOVERY_TIMEOUT_SECONDS:-300}"

api() {
  curl --silent --show-error --fail \
    -H "Authorization: Bearer $NETLIFY_AUTH_TOKEN" \
    "$@"
}

echo "Awaiting Netlify production deploy for commit $COMMIT_SHA"

DEPLOY_ID=""
elapsed=0
while [ "$elapsed" -lt "$DISCOVERY_TIMEOUT_SECONDS" ]; do
  DEPLOYS=$(api "https://api.netlify.com/api/v1/sites/$NETLIFY_SITE_ID/deploys?per_page=20")
  DEPLOY_ID=$(echo "$DEPLOYS" | jq -r --arg sha "$COMMIT_SHA" \
    '[.[] | select(.commit_ref == $sha and .context == "production") | .id] | .[0] // ""')

  if [ -n "$DEPLOY_ID" ]; then
    echo "Found deploy: $DEPLOY_ID"
    break
  fi

  echo "  [${elapsed}s] no production deploy yet for $COMMIT_SHA"
  sleep "$POLL_INTERVAL_SECONDS"
  elapsed=$((elapsed + POLL_INTERVAL_SECONDS))
done

if [ -z "$DEPLOY_ID" ]; then
  echo "Timeout: no production deploy found for $COMMIT_SHA within ${DISCOVERY_TIMEOUT_SECONDS}s" >&2
  exit 1
fi

echo "Polling deploy state every ${POLL_INTERVAL_SECONDS}s (timeout: ${POLL_TIMEOUT_SECONDS}s)..."

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
      echo "Logs: https://app.netlify.com/sites/$NETLIFY_SITE_ID/deploys/$DEPLOY_ID" >&2
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
