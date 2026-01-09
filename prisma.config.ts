import 'dotenv/config';
import path from 'node:path';
import { defineConfig, type PrismaConfig } from 'prisma/config';
import { env } from './env';

export default defineConfig({
  schema: path.join(import.meta.dirname, 'lib', 'db', 'schema.prisma'),
  datasource: {
    // Note: do _not_ use the prisma/config `env()` utility, as it enforces
    // that the variable is set at config time, which breaks certain workflows
    // (e.g. generating the client without a live database connection).
    url: env.DATABASE_URL,
  },
}) satisfies PrismaConfig;
