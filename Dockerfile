FROM node:lts-alpine AS base

# Install dependencies only when needed
FROM base AS deps

# Install libc6-compat for better compatibility and git for version info
RUN apk add --no-cache libc6-compat git

WORKDIR /app

# Enable corepack early for better caching
RUN corepack enable

# Copy dependency files
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml prisma.config.ts env.js ./
COPY vendor/vitest-config ./vendor/vitest-config
COPY lib/db/schema.prisma ./lib/db/schema.prisma

# Install pnpm and dependencies with cache mount for faster builds
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    --mount=type=cache,target=/root/.cache/pnpm \
    corepack enable pnpm && pnpm i --frozen-lockfile --prefer-offline --ignore-scripts

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

# Copy runtime scripts, database files, and config needed by migrate-and-start.sh.
# The standalone output copied above already ships its own traced node_modules
# (~44MB) at /app/node_modules — we keep it rather than copying the full ~1.7GB
# dev install. The startup scripts' extra deps go in an isolated tree below.
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/lib/db ./lib/db
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./
COPY --from=builder --chown=nextjs:nodejs /app/env.js ./
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.json ./
# The mirrored tsconfig.json extends ./tsconfig/web.json (vendored by
# scripts/mirror-app.mjs), so the startup scripts need that directory present.
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig ./tsconfig

# Install ONLY the deps the startup scripts need (prisma CLI, tsx, and the
# packages the .ts scripts import), pinned to the app's versions, into
# scripts/node_modules. Node resolution walks up from scripts/, so the scripts
# see both this tree and the standalone node_modules. The npm download cache is a
# BuildKit cache mount (persists across builds, not baked into the image), so
# repeat rebuilds skip re-downloading; only /tmp scratch is removed in-layer.
# (Replaces a `pnpm add --force` that baked a 3.6GB pnpm store + a redundant
# 1.7GB node_modules copy into the image.)
#
# `@codaco/interview` is unpacked rather than installed. The startup scripts
# import exactly one of its entries — the standalone `protocol-schema-version`
# bundle naming the schema version this build's interview runtime executes —
# and that bundle's only runtime import is `@codaco/protocol-validation`,
# installed above. The package's own dependencies (mapbox-gl, posthog-js,
# lucide-react, the Redux stack) exist for the interview UI, which these
# scripts never load, and would add ~250MB to a ~44MB runtime tree. If a
# startup script ever imports another entry of this package, install it
# properly instead.
#
# The two @codaco packages install at the EXACT versions the generated pnpm
# lockfile resolved (LV below), never the manifest's caret range: the schema
# version the startup migration targets resolves through these packages, while
# the interview runtime that must execute the migrated protocols is baked into
# the Next build from the lockfile. A caret install rebuilt after a later
# release could fetch newer package code and migrate production rows to a
# schema the bundled runtime cannot run.
COPY --from=builder /app/package.json /tmp/package.json
COPY --from=builder /app/pnpm-lock.yaml /tmp/pnpm-lock.yaml
RUN --mount=type=cache,target=/root/.npm \
    set -e; \
    V() { node -p "require('/tmp/package.json').dependencies?.['$1'] || require('/tmp/package.json').devDependencies?.['$1']"; }; \
    LV() { \
      v=$(awk -v dep="'$1':" '/^packages:/{exit} $1==dep{f=1;next} f&&$1=="specifier:"{next} f&&$1=="version:"{sub(/\(.*/,"",$2);print $2;exit} f{f=0}' /tmp/pnpm-lock.yaml); \
      [ -n "$v" ] || { echo "pnpm-lock.yaml has no resolved version for $1" >&2; exit 1; }; \
      printf '%s' "$v"; \
    }; \
    mkdir -p /tmp/runtime && cd /tmp/runtime; \
    printf '{"name":"fresco-runtime-deps","private":true}\n' > package.json; \
    npm install --no-audit --no-fund \
      "prisma@$(V prisma)" \
      "tsx@$(V tsx)" \
      "@prisma/client@$(V @prisma/client)" \
      "@prisma/adapter-pg@$(V @prisma/adapter-pg)" \
      "dotenv@$(V dotenv)" \
      "zod@$(V zod)" \
      "@t3-oss/env-nextjs@$(V @t3-oss/env-nextjs)" \
      "@codaco/protocol-validation@$(LV @codaco/protocol-validation)"; \
    npm pack --silent --pack-destination /tmp "@codaco/interview@$(LV @codaco/interview)"; \
    mkdir -p /tmp/interview-pack /tmp/runtime/node_modules/@codaco; \
    tar xzf /tmp/codaco-interview-*.tgz -C /tmp/interview-pack; \
    mv /tmp/interview-pack/package /tmp/runtime/node_modules/@codaco/interview; \
    ( cd /tmp/runtime/node_modules && tar cf - . ) | ( cd /app/node_modules && tar xf - ); \
    chown -R nextjs:nodejs /app/node_modules; \
    cd /app && rm -rf /tmp/runtime /root/.cache /tmp/package.json \
      /tmp/pnpm-lock.yaml /tmp/interview-pack /tmp/codaco-interview-*.tgz

# Switch to non-root user
USER nextjs

EXPOSE 3000

# Use exec form for better signal handling
CMD ["sh", "scripts/migrate-and-start.sh"]
