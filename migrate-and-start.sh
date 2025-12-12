#!/bin/sh
set -e

npx tsx scripts/setup-database.ts
npx tsx scripts/initialize.ts
exec node server.js
