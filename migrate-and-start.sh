#!/bin/sh

npx prisma migrate deploy
node server.js