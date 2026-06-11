import { z } from 'zod';
import { z as zm } from 'zod/mini';

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
    freezeInterviewsAfterCompletion: z.boolean(),
    enableInterviewDataApi: z.boolean(),
    storageProvider: z.enum(['uploadthing', 's3']),
    s3Endpoint: z.string(),
    s3PublicUrl: z.string(),
    s3Bucket: z.string(),
    s3Region: z.string(),
    s3AccessKeyId: z.string(),
    s3SecretAccessKey: z.string(),
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
  initializedAt: z.preprocess(
    (val) =>
      val == null ? null : new Date(typeof val === 'string' ? val : ''),
    z.date().nullable().default(null),
  ),
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
  freezeInterviewsAfterCompletion: z.preprocess(
    parseBoolean,
    z.boolean().default(true),
  ),
  enableInterviewDataApi: z.preprocess(
    parseBoolean,
    z.boolean().default(false),
  ),
  storageProvider: z.preprocess(
    (val) => (typeof val === 'string' ? val : undefined),
    z.enum(['uploadthing', 's3']).optional(),
  ),
  s3Endpoint: z.string().optional(),
  s3PublicUrl: z.string().optional(),
  s3Bucket: z.string().optional(),
  s3Region: z.string().optional(),
  s3AccessKeyId: z.string().optional(),
  s3SecretAccessKey: z.string().optional(),
  uploadThingToken: z.string().optional(),
  installationId: z.string().optional(),
});

// Custom parser for UPLOADTHING_TOKEN to remove token name and quotes
const parseUploadThingToken = (token: string) => {
  return token.replace(/^(UPLOADTHING_TOKEN=)?['"]?|['"]$/g, '').trim();
};

// Client-side schema using zod/mini for smaller bundle
export const createUploadThingTokenSchema = zm.pipe(
  zm
    .string()
    .check(
      zm.minLength(10, 'UPLOADTHING_TOKEN must have at least 10 characters.'),
    ),
  zm.transform((token: string) => parseUploadThingToken(token)),
);

export const createUploadThingTokenFormSchema = zm.object({
  uploadThingToken: createUploadThingTokenSchema,
});
