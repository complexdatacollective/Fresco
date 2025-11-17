import { z } from 'zod';
import { zfd } from 'zod-form-data';

// Helper for parsing string booleans from database
const stringBool = z
  .union([z.boolean(), z.string()])
  .transform((val) => {
    if (typeof val === 'boolean') return val;
    return val === 'true' || val === '1';
  })
  .default(false);

// Variation of the schema that converts the string types in the db to the correct types
export const appSettingPreprocessedSchema = z.object({
  initializedAt: z.coerce.date(),
  configured: stringBool,
  allowAnonymousRecruitment: stringBool,
  limitInterviews: stringBool,
  disableAnalytics: stringBool,
  disableSmallScreenOverlay: stringBool,
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

export const createUploadThingTokenFormSchema = zfd
  .formData({
    uploadThingToken: zfd.text(),
  })
  .transform((data) => {
    const token = parseUploadThingToken(data.uploadThingToken);
    if (token.length < 10) {
      throw new Error('UPLOADTHING_TOKEN must have at least 10 characters.');
    }
    return { uploadThingToken: token };
  });
