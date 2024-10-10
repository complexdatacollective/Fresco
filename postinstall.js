import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

import { execSync } from 'child_process';

// Always run prisma generate
execSync('prisma generate', { stdio: 'inherit' });

const prisma = new PrismaClient();

// if there's no initializedAt date, we need to create it.
const initializedAt = await prisma.appSettings.findFirst({
  where: {
    key: 'initializedAt',
  },
});

if (!initializedAt) {
  await prisma.appSettings.create({
    data: {
      key: 'initializedAt',
      value: new Date().toISOString(),
    },
  });
}
