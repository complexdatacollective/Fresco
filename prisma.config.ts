import path from 'node:path';
import type { PrismaConfig } from 'prisma';
import { defineConfig } from 'prisma/config';

// Load environment variables for Prisma CLI (migrations, etc.)
// Note: Runtime connection is handled via adapter in utils/db.ts

type PrismaConfigWithMigrations = PrismaConfig & {
  migrate?: {
    resolveUrl: () => Promise<string>;
  };
};

export default defineConfig({
  schema: path.join(import.meta.dirname, 'lib', 'db', 'schema.prisma'),
}) satisfies PrismaConfigWithMigrations;
