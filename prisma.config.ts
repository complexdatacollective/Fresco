import path from 'node:path';
import { defineConfig, env, type PrismaConfig } from 'prisma/config';

export default defineConfig({
  schema: path.join(import.meta.dirname, 'lib', 'db', 'schema.prisma'),
  datasource: {
    url: env('DATABASE_URL'),
  },
}) satisfies PrismaConfig;
