/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * We set the the initializedAt key here, because this script is run when the
 * app is first deployed.
 **/
async function setInitializedAt() {
  // Check if app is already initialized
  const initializedAt = await prisma.appSettings.findUnique({
    where: {
      key: 'initializedAt',
    },
  });

  if (initializedAt) {
    console.log(`App already initialized at ${initializedAt}. Skipping.`);
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

// Self executing function
(async () => {
  await setInitializedAt();
})();
