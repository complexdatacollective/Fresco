import { createCachedFunction } from '~/lib/cache';
import { prisma } from '~/utils/db';

export const getUploadthingVariables = createCachedFunction(async () => {
  const keyValues = await prisma.environment.findMany({
    where: {
      key: {
        in: ['UPLOADTHING_SECRET', 'UPLOADTHING_APP_ID'],
      },
    },
  });

  const uploadthingVariables = keyValues.reduce(
    (acc, { key, value }) => {
      acc[key] = value;
      return acc;
    },
    {} as Record<string, string>,
  );

  return {
    UPLOADTHING_SECRET: uploadthingVariables.UPLOADTHING_SECRET ?? null,
    UPLOADTHING_APP_ID: uploadthingVariables.UPLOADTHING_APP_ID ?? null,
  };
}, ['getUploadthingVariables']);

export const getInstallationId = createCachedFunction(async () => {
  const keyValues = await prisma.environment.findMany({
    where: {
      key: 'INSTALLATION_ID',
    },
  });

  return keyValues[0]?.value ?? null;
}, ['getInstallationId']);

export const getPublicUrl = createCachedFunction(async () => {
  const keyValues = await prisma.environment.findMany({
    where: {
      key: 'PUBLIC_URL',
    },
  });

  return keyValues[0]?.value ?? null;
}, ['getPublicUrl']);

export const getSandboxMode = createCachedFunction(async () => {
  const keyValues = await prisma.environment.findMany({
    where: {
      key: 'SANDBOX_MODE',
    },
  });

  return keyValues[0]?.value === 'true';
}, ['getSandboxMode']);

export const getDisableAnalytics = createCachedFunction(async () => {
  const keyValues = await prisma.environment.findMany({
    where: {
      key: 'DISABLE_ANALYTICS',
    },
  });

  return keyValues[0]?.value === 'true';
}, ['getDisableAnalytics']);
