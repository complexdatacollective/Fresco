import { z } from 'zod';
import { zfd } from 'zod-form-data';

// Variation of the schema that converts the string types in the db to the correct types
export const appSettingPreprocessedSchema = z.object({
  initializedAt: z.coerce.date(),
  configured: z.stringbool().default(false),
  allowAnonymousRecruitment: z.stringbool().default(false),
  limitInterviews: z.stringbool().default(false),
  disableAnalytics: z.stringbool().default(false),
  disableSmallScreenOverlay: z.stringbool().default(false),
  uploadThingToken: z.string(),
  installationId: z.string().nullable().default(null),
});

export type AppSetting = keyof z.infer<typeof appSettingPreprocessedSchema>;

// Custom parser for UPLOADTHING_TOKEN to remove token name and quotes
const parseUploadThingToken = (token: string) => {
  return token.replace(/^(UPLOADTHING_TOKEN=)?['"]?|['"]$/g, '').trim();
};

export const createUploadThingTokenSchema = z
  .string()
  .min(10, {
    message: 'UPLOADTHING_TOKEN must have at least 10 characters.',
  })
  .transform((token) => parseUploadThingToken(token));

export const createUploadThingTokenFormSchema = zfd.formData(
  z.object({
    uploadThingToken: createUploadThingTokenSchema,
  }),
);
