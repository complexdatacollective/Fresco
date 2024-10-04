import { z } from 'zod';

export const appSettingSchema = z.object({
  configured: z.boolean(),
  allowAnonymousRecruitment: z.boolean(),
  limitInterviews: z.boolean(),
  initializedAt: z.date(),
  installationId: z.string(),
  SANDBOX_MODE: z.boolean(),
  DISABLE_ANALYTICS: z.boolean(),
  PUBLIC_URL: z.string().optional(),
  UPLOADTHING_SECRET: z.string().optional(),
  UPLOADTHING_APP_ID: z.string().optional(),
});
