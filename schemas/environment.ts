import { z } from 'zod';
import { zfd } from 'zod-form-data';

// Custom parser for UPLOADTHING_TOKEN to remove token name and quotes
const parseUploadThingToken = (token: string) => {
  return token.replace(/^(UPLOADTHING_TOKEN=)?['"]?|['"]$/g, '').trim();
};

export const createEnvironmentSchema = z.object({
  uploadThingToken: z
    .string()
    .min(10, {
      message: 'UPLOADTHING_TOKEN must have at least 10 characters.',
    })
    .transform((token) => parseUploadThingToken(token)),
});

export const createEnvironmentFormSchema = zfd.formData(
  createEnvironmentSchema,
);
