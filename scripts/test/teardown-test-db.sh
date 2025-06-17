#!/bin/bash

echo "🧹 Cleaning up test database..."

# Stop and remove test database container
docker-compose -f docker-compose.test.yml down -v

echo "✅ Test database cleanup complete!"