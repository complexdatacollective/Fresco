import { z } from 'zod';
import { zfd } from 'zod-form-data';

const appSettingsSchema = z
  .object({
    initializedAt: z.date(),
    configured: z.boolean(),
    allowAnonymousRecruitment: z.boolean(),
    limitInterviews: z.boolean(),
    uploadThingToken: z.string(),
    installationId: z.string(),
    disableAnalytics: z.boolean(),
    disableSmallScreenOverlay: z.boolean(),
    previewModeRequireAuth: z.boolean(),
  })
  .strict();

export type AppSetting = keyof z.infer<typeof appSettingsSchema>;

const parseBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
};

// Variation of the schema that converts the string types in the db to the correct types
export const appSettingPreprocessedSchema = appSettingsSchema.extend({
  initializedAt: z.coerce.date(),
  configured: z.preprocess(parseBoolean, z.boolean().default(false)),
  allowAnonymousRecruitment: z.preprocess(
    parseBoolean,
    z.boolean().default(false),
  ),
  limitInterviews: z.preprocess(parseBoolean, z.boolean().default(false)),
  disableAnalytics: z.preprocess(parseBoolean, z.boolean().default(false)),
  disableSmallScreenOverlay: z.preprocess(
    parseBoolean,
    z.boolean().default(false),
  ),
  previewModeRequireAuth: z.preprocess(parseBoolean, z.boolean().default(true)),
  uploadThingToken: z.string().optional(),
  installationId: z.string().optional(),
});

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
