#!/bin/sh
set -e

npx prisma generate
npx tsx scripts/setup-database.ts
npx tsx scripts/initialize.ts
exec node server.js
