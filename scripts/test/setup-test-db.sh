#!/bin/bash

echo "🚀 Setting up test database..."

# Start test database container
docker-compose -f docker-compose.test.yml up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
until docker-compose -f docker-compose.test.yml exec -T postgres-test pg_isready -U postgres; do
  sleep 1
done

echo "📊 Running database migrations..."

# Set test environment
export NODE_ENV=test
export POSTGRES_PRISMA_URL="postgresql://postgres:password@localhost:5433/fresco_test?pgbouncer=true&connect_timeout=15"
export POSTGRES_URL_NON_POOLING="postgresql://postgres:password@localhost:5433/fresco_test?connect_timeout=15"

# Run Prisma migrations
pnpm exec prisma migrate deploy

echo "✅ Test database setup complete!"