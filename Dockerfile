FROM node:lts-alpine AS base

# Install dependencies only when needed
FROM base AS deps

# Install libc6-compat for better compatibility and git for version info
RUN apk add --no-cache libc6-compat git

WORKDIR /app

# Enable corepack early for better caching
RUN corepack enable

# Copy dependency files
COPY package.json pnpm-lock.yaml* prisma.config.ts env.js ./
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

# Build arg to disable image optimization (useful for test environments)
ARG DISABLE_IMAGE_OPTIMIZATION=false
ENV DISABLE_IMAGE_OPTIMIZATION=$DISABLE_IMAGE_OPTIMIZATION

# Set environment variables for build - they are provided at runtime
ENV SKIP_ENV_VALIDATION=true
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=4096 --no-network-family-autoselection"

# Enable pnpm, generate Prisma client, and build
# Note: prisma generate must run here because the generated client (lib/db/generated/)
# is gitignored and not copied from deps stage (only node_modules is copied)
# and without the client being present, the build will fail.
#
# The client is generated _again_ as part of migrate-and-start.sh in the final image
# to ensure that it inherits the correct runtime environment variables.
RUN corepack enable pnpm && pnpm exec prisma generate && pnpm run build

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

# Copy runtime scripts, database files, and dependencies needed for tsx
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/lib/db ./lib/db
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./
COPY --from=builder --chown=nextjs:nodejs /app/env.js ./
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.json ./

# Install Prisma CLI for database migrations (required for setup-database.js)
# The standalone build doesn't include node_modules, so we install prisma via pnpm
# Read version from package.json to stay in sync
COPY --from=builder /app/package.json /tmp/package.json
RUN corepack enable pnpm && \
    PRISMA_VERSION=$(node -p "require('/tmp/package.json').devDependencies?.prisma || require('/tmp/package.json').dependencies?.prisma") && \
    echo "Installing prisma@$PRISMA_VERSION" && \
    pnpm add --force "prisma@$PRISMA_VERSION" && \
    rm /tmp/package.json

# Switch to non-root user
USER nextjs

EXPOSE 3000

# Use exec form for better signal handling
CMD ["sh", "scripts/migrate-and-start.sh"]
