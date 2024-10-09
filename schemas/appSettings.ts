import { z } from 'zod';

export const appSettingSchema = z.object({
  configured: z.boolean(),
  allowAnonymousRecruitment: z.boolean(),
  limitInterviews: z.boolean(),
  initializedAt: z.date(),
  installationId: z.string(),
  sandboxMode: z.boolean(),
  disableAnalytics: z.boolean(),
  publicUrl: z.string().url().optional(),
  uploadThingSecret: z.string().optional(),
  uploadThingAppId: z.string().optional(),
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
  uploadThingSecret: z.preprocess((value) => value, z.string()).optional(),
  uploadThingAppId: z.preprocess((value) => value, z.string()).optional(),
  installationId: z.preprocess((value) => value, z.string()),
  publicUrl: z.preprocess((value) => value, z.string().url()).optional(),
  sandboxMode: z.preprocess(parseBoolean, z.boolean()),
  disableAnalytics: z.preprocess(parseBoolean, z.boolean()),
});
