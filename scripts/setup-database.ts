/* eslint-disable no-console */
import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '~/lib/db/generated/client';
import { createPrismaAdapter } from '~/lib/db/adapter';
import { execSync, spawnSync } from 'child_process';
import { env } from '~/env';

const adapter = createPrismaAdapter(
  env.DATABASE_URL,
  env.USE_NEON_POSTGRES_ADAPTER,
);
const prisma = new PrismaClient({ adapter });

type TableRow = {
  table_name: string;
};

function checkForNeededMigrations(): boolean {
  const command = 'npx';
  const args = [
    'prisma',
    'migrate',
    'diff',
    '--to-schema-datasource',
    './lib/db/schema.prisma',
    '--from-schema-datamodel',
    './lib/db/schema.prisma',
    '--exit-code',
  ];

  const result = spawnSync(command, args, { encoding: 'utf-8' });

  if (result.error) {
    console.error('Failed to run command:', result.error);
    return false;
  }

  // Handling the exit code
  if (result.status === 0) {
    console.log('No differences between DB and schema detected.');
    return false;
  } else if (result.status === 2) {
    console.log('There are differences between the schemas.');
    return true;
  } else if (result.status === 1) {
    console.log('An error occurred.');
    return false;
  }

  return false;
}

/**
 * This function checks if the database is in a state where the workaround is needed.
 *
 * The workaround is needed when the database is not empty and the _prisma_migrations
 * table does not exist.
 */
async function shouldApplyWorkaround(): Promise<boolean> {
  const tables = await prisma.$queryRaw<TableRow[]>`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`;

  const databaseNotEmpty = tables.length > 0;
  const migrationsTableExists = tables.some(
    (table) => table.table_name === '_prisma_migrations',
  );

  return !migrationsTableExists && databaseNotEmpty;
}

async function handleMigrations(): Promise<void> {
  try {
    if (await shouldApplyWorkaround()) {
      console.log(
        'Workaround needed! Running: prisma migrate resolve --applied 0_init',
      );
      execSync('npx prisma migrate resolve --applied 0_init', {
        stdio: 'inherit',
      });
    }

    // Determine if there are any migrations to run
    const needsMigrations = checkForNeededMigrations();

    if (needsMigrations) {
      console.log('Migrations needed! Running: prisma migrate deploy');
      execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    } else {
      console.log('No migrations needed.');
    }
  } catch (error) {
    console.error('Error during migration process:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

await handleMigrations();
