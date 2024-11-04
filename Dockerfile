FROM node:lts-alpine  AS base

# Install dependencies only when needed
FROM base AS deps

# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
#RUN apk add --no-cache libc6-compat
WORKDIR /app

# Prisma stuff
COPY prisma ./prisma

# Copy package.json and lockfile, along with postinstall script
COPY package.json pnpm-lock.yaml* postinstall.js migrate-and-start.sh setup-database.js initialize.js ./

# # Install pnpm and install dependencies
RUN corepack enable pnpm && pnpm i --frozen-lockfile

# ---------

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Install git - this is needed to get the app version during build
RUN apk add --no-cache git

ENV SKIP_ENV_VALIDATION=true
RUN corepack enable pnpm && pnpm run build

# If using npm comment out above and use below instead
# RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# disable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/initialize.js ./
COPY --from=builder --chown=nextjs:nodejs /app/setup-database.js ./
COPY --from=builder --chown=nextjs:nodejs /app/migrate-and-start.sh ./
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
# CMD HOSTNAME="0.0.0.0" npm run start:prod
CMD ["sh", "migrate-and-start.sh"]