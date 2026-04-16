import { createHmac } from 'crypto';
import Sqids, { defaultOptions } from 'sqids';
import { type PresignedUploadUrl } from '~/lib/storage/services/AssetStorage';
import { getAppSetting } from '~/queries/appSettings';

const UPLOADTHING_SLUG = 'assetRouter';
const UPLOADTHING_VERSION = '7.4.0';
const REGISTER_TIMEOUT_MS = 30_000;
const DEFAULT_TTL_MS = 60 * 60 * 1000;

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

// Key-derivation and signing algorithms from:
// https://docs.uploadthing.com/uploading-files#generating-presigned-urls

function hmacSha256(data: string, secret: string): string {
  return createHmac('sha256', secret).update(data).digest('hex');
}

function djb2(str: string): number {
  let hash = 5381;
  let i = str.length;
  while (i) {
    hash = (hash * 33) ^ str.charCodeAt(--i);
  }
  return (hash & 0xbfffffff) | ((hash >>> 1) & 0x40000000);
}

function shuffle(str: string, seed: string) {
  const chars = str.split('');
  const seedNum = djb2(seed);
  let temp: string;
  let j: number;
  for (let i = 0; i < chars.length; i++) {
    j = ((seedNum % (i + 1)) + i) % chars.length;
    temp = chars[i] ?? '';
    chars[i] = chars[j] ?? '';
    chars[j] = temp;
  }
  return chars.join('');
}

function generateKey(appId: string, fileSeed: string) {
  const alphabet = shuffle(defaultOptions.alphabet, appId);
  const encodedAppId = new Sqids({ alphabet, minLength: 12 }).encode([
    Math.abs(djb2(appId)),
  ]);
  const encodedFileSeed = Buffer.from(fileSeed).toString('base64url');
  return `${encodedAppId}${encodedFileSeed}`;
}

export function generatePresignedUploadUrl(options: {
  fileName: string;
  fileSize: number;
  tokenData: ParsedToken;
  ttlMs?: number;
}): PresignedUploadUrl {
  const { fileName, fileSize, tokenData, ttlMs = DEFAULT_TTL_MS } = options;
  const { apiKey, appId, regions, ingestHost } = tokenData;

  const fileSeed = `${fileName}-${fileSize}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const fileKey = generateKey(appId, fileSeed);
  const region = regions[0] ?? 'sea1';
  const expiresAt = Date.now() + ttlMs;

  const searchParams = new URLSearchParams({
    'expires': String(expiresAt),
    'x-ut-identifier': appId,
    'x-ut-file-name': fileName,
    'x-ut-file-size': String(fileSize),
    'x-ut-slug': UPLOADTHING_SLUG,
    'x-ut-content-disposition': 'inline',
    'x-ut-acl': 'public-read',
  });

  const baseUrl = `https://${region}.${ingestHost}/${fileKey}`;
  const urlWithParams = `${baseUrl}?${searchParams.toString()}`;
  const signature = `hmac-sha256=${hmacSha256(urlWithParams, apiKey)}`;

  return {
    uploadUrl: `${urlWithParams}&signature=${encodeURIComponent(signature)}`,
    fileKey,
    publicUrl: `https://${appId}.ufs.sh/f/${fileKey}`,
  };
}

// POST to /route-metadata before uploads so UploadThing accepts CORS preflight
// from external clients (e.g. Firefox/Safari browsers embedding Architect).
export async function registerUploadWithUploadThing(options: {
  fileKeys: string[];
  tokenData: ParsedToken;
  callbackUrl: string;
}): Promise<void> {
  const { fileKeys, tokenData, callbackUrl } = options;
  const { apiKey, regions, ingestHost } = tokenData;

  const region = regions[0] ?? 'sea1';
  const ingestUrl = `https://${region}.${ingestHost}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REGISTER_TIMEOUT_MS);

  try {
    const response = await fetch(`${ingestUrl}/route-metadata`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-uploadthing-api-key': apiKey,
        'x-uploadthing-version': UPLOADTHING_VERSION,
        'x-uploadthing-be-adapter': 'server',
        'x-uploadthing-fe-package': '@uploadthing/react',
      },
      body: JSON.stringify({
        fileKeys,
        metadata: {},
        // isDev:true is an UploadThing dev-server handshake that idles ~60s
        isDev: false,
        callbackUrl,
        callbackSlug: UPLOADTHING_SLUG,
        awaitServerData: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to register upload with UploadThing: ${response.status} ${errorText}`,
      );
    }
  } finally {
    clearTimeout(timeoutId);
  }
}
