'use server';

import { safeRevalidateTag } from '~/lib/cache';
import { createEnvironmentFormSchema } from '~/schemas/environment';
import { prisma } from '~/utils/db';

// actions for storing env variables in the db

export async function storeEnvironment(formData: unknown) {
  const parsedFormData = createEnvironmentFormSchema.safeParse(formData);

  if (!parsedFormData.success) {
    return {
      success: false,
      error: 'Invalid form submission',
    };
  }

  try {
    const {
      UPLOADTHING_SECRET,
      UPLOADTHING_APP_ID,
      PUBLIC_URL,
      INSTALLATION_ID,
    } = parsedFormData.data;

    const data = [
      { key: 'UPLOADTHING_SECRET', value: UPLOADTHING_SECRET },
      { key: 'UPLOADTHING_APP_ID', value: UPLOADTHING_APP_ID },
    ];

    // add optional env variables if they were provided
    if (PUBLIC_URL) {
      data.push({ key: 'PUBLIC_URL', value: PUBLIC_URL });
    }

    if (INSTALLATION_ID) {
      data.push({ key: 'INSTALLATION_ID', value: INSTALLATION_ID });
    }

    // add the default env variables
    data.push({ key: 'SANDBOX_MODE', value: 'false' });
    data.push({ key: 'DISABLE_ANALYTICS', value: 'false' });

    await prisma.environment.createMany({
      data,
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to store environment',
    };
  }
}

export async function setSandboxMode(sandboxMode: boolean) {
  await prisma.environment.update({
    where: { key: 'SANDBOX_MODE' },
    data: {
      value: sandboxMode.toString(),
    },
  });
  safeRevalidateTag('getSandboxMode');
  return sandboxMode;
}

export async function setDisableAnalytics(disableAnalytics: boolean) {
  await prisma.environment.update({
    where: { key: 'DISABLE_ANALYTICS' },
    data: {
      value: disableAnalytics.toString(),
    },
  });
  safeRevalidateTag('getDisableAnalytics');
  return disableAnalytics;
}
