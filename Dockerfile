FROM node:lts-alpine AS base

# Install dependencies only when needed
FROM base AS deps

# Install libc6-compat for better compatibility and git for version info
RUN apk add --no-cache libc6-compat git

WORKDIR /app

# Enable corepack early for better caching
RUN corepack enable

# Copy dependency files and postinstall script
COPY package.json pnpm-lock.yaml* postinstall.js prisma.config.ts ./
COPY lib/db/schema.prisma ./lib/db/schema.prisma

# Install pnpm and dependencies with cache mount for faster builds
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    --mount=type=cache,target=/root/.cache/pnpm \
    corepack enable pnpm && pnpm i --frozen-lockfile --prefer-offline

# ---------

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Install git for version info
RUN apk add --no-cache git

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Set environment variables for build - they are provided at runtime
ENV SKIP_ENV_VALIDATION=true
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Enable pnpm and build
RUN corepack enable pnpm && pnpm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

# Set production environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Create user and group in a single layer
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Create .next directory with correct permissions
RUN mkdir .next && chown nextjs:nodejs .next

# Copy built application with correct permissions
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy runtime scripts, database schema, and dependencies needed for tsx
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/migrate-and-start.sh ./
COPY --from=builder --chown=nextjs:nodejs /app/lib/db/schema.prisma ./lib/db/schema.prisma
COPY --from=builder --chown=nextjs:nodejs /app/lib/db/migrations ./lib/db/migrations
COPY --from=builder --chown=nextjs:nodejs /app/lib/db/generated ./lib/db/generated
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./
COPY --from=builder --chown=nextjs:nodejs /app/env.js ./
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.json ./

# Switch to non-root user
USER nextjs

EXPOSE 3000

# Use exec form for better signal handling
CMD ["sh", "migrate-and-start.sh"]
