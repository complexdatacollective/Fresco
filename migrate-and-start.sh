#!/bin/sh
set -e

node setup-database.js
node initialize.js
exec node server.js