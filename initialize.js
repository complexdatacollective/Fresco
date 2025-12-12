/* eslint-disable no-console, no-process-env */
import dotenv from 'dotenv';
dotenv.config();

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './lib/db/generated/client.ts';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

/** 
 * We set the the initializedAt key here, because this script is run when the
 * app is first deployed.
**/
async function setInitializedAt() {
  // Check if app is already initialized
  const initializedAt = await prisma.appSettings.findUnique({
    where: {
      key: 'initializedAt'
    }
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
      value: now
    }
  });
}

// Self executing function
(async () => {
  await setInitializedAt();
})();