import { z } from 'zod/mini';
import { getAppSetting } from '~/queries/appSettings';

const uploadThingTokenSchema = z.object({
  apiKey: z.string().check(z.minLength(1)),
  appId: z.string().check(z.minLength(1)),
  regions: z.array(z.string()),
  ingestHost: z._default(z.optional(z.string()), 'ingest.uploadthing.com'),
});

export type ParsedToken = z.infer<typeof uploadThingTokenSchema>;

export async function parseUploadThingToken(): Promise<ParsedToken | null> {
  const token = await getAppSetting('uploadThingToken');
  if (!token) return null;

  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parsed = uploadThingTokenSchema.safeParse(JSON.parse(decoded));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
