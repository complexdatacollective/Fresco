import { z } from 'zod';
import { zfd } from 'zod-form-data';

export const createEnvironmentSchema = z.object({
  uploadThingToken: z.string().min(10, {
    message: 'UPLOADTHING_TOKEN must have at least 10 characters.',
  }),
  publicUrl: z.string().optional(),
  installationId: z.string().optional(),
});

export const createEnvironmentFormSchema = zfd.formData(
  createEnvironmentSchema,
);
