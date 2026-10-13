#!/bin/sh
set -e

# prisma + tsx are merged into /app/node_modules by the Docker runner stage, so
# their binaries live in ./node_modules/.bin. Call them by path so npx never
# falls back to a registry download at runtime.
PRISMA=./node_modules/.bin/prisma
TSX=./node_modules/.bin/tsx

"$PRISMA" generate
"$TSX" scripts/setup-database.ts
"$TSX" scripts/initialize.ts

# Next writes its runtime incremental cache (the fetch cache and ISR) into
# .next/cache. The image creates it, but that only settles the image layer: a
# volume mounted over /app/.next hides the directory and its ownership, and a
# read-only root filesystem makes it unwritable whatever the image did. In both
# cases Next discovers the problem mid-request and surfaces it as an unhandled
# rejection rather than a cache miss, so a deployment that is merely running
# uncached reports a crash.
#
# Settle what can be settled here, after any mount is in place and as the user
# that will serve requests: an empty or app-owned mount gets the directory
# created in it, which is the common case and removes the error entirely.
#
# When the path cannot be written at all — a root-owned bind mount, a read-only
# filesystem — this does NOT stop the errors. `cacheComponents` is on, so Next
# still writes cache entries to .next/cache and those writes still reject. All
# this does then is name the cause once at boot, so the rejections that follow
# are attributable instead of mysterious. Making them stop needs a cache handler
# that falls back off the filesystem, which is a larger change than this.
if ! mkdir -p .next/cache 2>/dev/null || ! [ -w .next/cache ]; then
  echo "fresco: /app/.next/cache is not writable. Next will keep trying to write cache entries there and those writes will fail, which is reported as an application error. If /app/.next is a mounted volume or the filesystem is read-only, make that path writable by uid 1001." >&2
fi

exec node server.js
