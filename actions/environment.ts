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
    const { UPLOADTHING_SECRET, UPLOADTHING_APP_ID } = parsedFormData.data;

    await prisma.environment.createMany({
      data: [
        { key: 'UPLOADTHING_SECRET', value: UPLOADTHING_SECRET },
        { key: 'UPLOADTHING_APP_ID', value: UPLOADTHING_APP_ID },
      ],
    });
  } catch (error) {
    return {
      success: false,
      error: 'Failed to store environment',
    };
  }
}
