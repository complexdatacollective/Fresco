import { z } from 'zod';

export const appSettingSchema = z.object({
  configured: z.boolean(),
  allowAnonymousRecruitment: z.boolean(),
  limitInterviews: z.boolean(),
  initializedAt: z.date(),
  installationId: z.string(),
  SANDBOX_MODE: z.boolean(),
  DISABLE_ANALYTICS: z.boolean(),
  PUBLIC_URL: z.string().url().optional(),
  UPLOADTHING_SECRET: z.string().optional(),
  UPLOADTHING_APP_ID: z.string().optional(),
});

const parseBoolean = (value: unknown): boolean | undefined => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
};

export const appSettingPreprocessedSchema = appSettingSchema.extend({
  initializedAt: z.preprocess((value) => {
    if (typeof value === 'string' || value instanceof Date) {
      const date = new Date(value);
      return isNaN(date.getTime()) ? undefined : date;
    }
    return value;
  }, z.date()),
  configured: z.preprocess(parseBoolean, z.boolean()),
  allowAnonymousRecruitment: z.preprocess(parseBoolean, z.boolean()),
  limitInterviews: z.preprocess(parseBoolean, z.boolean()),
  UPLOADTHING_SECRET: z.preprocess((value) => value, z.string()).optional(),
  UPLOADTHING_APP_ID: z.preprocess((value) => value, z.string()).optional(),
  installationId: z.preprocess((value) => value, z.string()),
  PUBLIC_URL: z.preprocess((value) => value, z.string().url()).optional(),
  SANDBOX_MODE: z.preprocess(parseBoolean, z.boolean()),
  DISABLE_ANALYTICS: z.preprocess(parseBoolean, z.boolean()),
});
