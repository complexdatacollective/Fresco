/* eslint-disable no-console */
import dotenv from 'dotenv';
dotenv.config();

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '~/lib/db/generated/client';
import { env } from '~/env';

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

/**
 * We set the initializedAt key here, because this script is run when the
 * app is first deployed.
 */
async function setInitializedAt(): Promise<void> {
  // Check if app is already initialized
  const initializedAt = await prisma.appSettings.findUnique({
    where: {
      key: 'initializedAt',
    },
  });

  if (initializedAt) {
    console.log('App already initialized. Skipping.');
    return;
  }

  const now = new Date().toISOString();

  console.log(`Setting initializedAt to ${now}.`);

  await prisma.appSettings.upsert({
    where: {
      key: 'initializedAt',
    },
    // No update emulates findOrCreate
    update: {},
    create: {
      key: 'initializedAt',
      value: now,
    },
  });
}

await setInitializedAt();
