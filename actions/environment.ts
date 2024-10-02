'use server';

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
