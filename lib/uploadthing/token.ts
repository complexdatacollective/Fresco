import { getAppSetting } from '~/queries/appSettings';

export type ParsedToken = {
  apiKey: string;
  appId: string;
  regions: string[];
  ingestHost: string;
};

export async function parseUploadThingToken(): Promise<ParsedToken | null> {
  const token = await getAppSetting('uploadThingToken');
  if (!token) return null;

  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parsed = JSON.parse(decoded) as ParsedToken;
    return {
      apiKey: parsed.apiKey,
      appId: parsed.appId,
      regions: parsed.regions,
      ingestHost: parsed.ingestHost ?? 'ingest.uploadthing.com',
    };
  } catch {
    return null;
  }
}
