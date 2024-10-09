import { z } from 'zod';
import { zfd } from 'zod-form-data';

export const createEnvironmentSchema = z.object({
  uploadThingSecret: z
    .string()
    .refine((val) => val?.startsWith('sk_live_') && val.length >= 10, {
      message:
        'UPLOADTHING_SECRET must start with "sk_live_" and have at least 10 characters.',
    }),
  uploadThingAppId: z.string().min(10, {
    message: 'UPLOADTHING_APP_ID must have at least 10 characters.',
  }),
  publicUrl: z.string().optional(),
  installationId: z.string().optional(),
});

export const createEnvironmentFormSchema = zfd.formData(
  createEnvironmentSchema,
);
