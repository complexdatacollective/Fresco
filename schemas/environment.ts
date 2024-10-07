import { z } from 'zod';
import { zfd } from 'zod-form-data';

export const createEnvironmentSchema = z.object({
  UPLOADTHING_SECRET: z
    .string()
    .refine((val) => val?.startsWith('sk_live_') && val.length >= 10, {
      message:
        'UPLOADTHING_SECRET must start with "sk_live_" and have at least 10 characters.',
    }),
  UPLOADTHING_APP_ID: z.string().min(10, {
    message: 'UPLOADTHING_APP_ID must have at least 10 characters.',
  }),
  PUBLIC_URL: z.string().optional(),
  INSTALLATION_ID: z.string().optional(),
});

export const createEnvironmentFormSchema = zfd.formData(
  createEnvironmentSchema,
);
