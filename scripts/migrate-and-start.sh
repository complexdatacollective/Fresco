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
exec node server.js
