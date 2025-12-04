/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client';
import { execSync, spawnSync } from 'child_process';

const prisma = new PrismaClient();

function checkForNeededMigrations() {
  // Use local prisma binary directly to avoid npx downloading a different version
  const command = './node_modules/.bin/prisma';
  const args = [
    'migrate',
    'diff',
    '--to-schema-datasource',
    './prisma/schema.prisma',
    '--from-schema-datamodel',
    './prisma/schema.prisma',
    '--exit-code',
  ];

  console.log(`Running: ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, { encoding: 'utf-8' });

  console.log('Migration diff result:', {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
    error: result.error,
  });

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
    console.log('An error occurred:', result.stderr);
    process.exit(1);
    return false;
  }

  // If we get an unexpected status code, log it and assume migrations are needed
  console.log(
    `Unexpected exit code: ${result.status}, assuming migrations needed`,
  );
  return true;
}

/**
 * This function checks if the database is in a state where the workaround is needed.
 *
 * The workaround is needed when the database is not empty and the _prisma_migrations
 * table does not exist.
 */
async function shouldApplyWorkaround() {
  const tables = await prisma.$queryRaw`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`;

  const databaseNotEmpty = tables.length > 0;
  const migrationsTableExists = tables.some(
    (table) => table.table_name === '_prisma_migrations',
  );

  return !migrationsTableExists && databaseNotEmpty;
}

async function handleMigrations() {
  try {
    // Use local prisma binary directly to avoid npx downloading a different version
    const prismaBin = './node_modules/.bin/prisma';

    // Log the current database state for debugging
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`;
    console.log('Current database tables:', tables);
    console.log('Database is empty:', tables.length === 0);

    if (await shouldApplyWorkaround()) {
      console.log(
        'Workaround needed! Running: prisma migrate resolve --applied 0_init',
      );
      execSync(`${prismaBin} migrate resolve --applied 0_init`, {
        stdio: 'inherit',
      });
    }

    // Determine if there are any migrations to run, by comparing the local schema with the database schema using prisma migrate diff
    const needsMigrations = checkForNeededMigrations();

    if (needsMigrations) {
      console.log('Migrations needed! Running: prisma migrate deploy');
      execSync(`${prismaBin} migrate deploy`, { stdio: 'inherit' });
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

(async () => {
  await handleMigrations();
})();
