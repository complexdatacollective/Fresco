import { createHmac } from 'crypto';
import Sqids, { defaultOptions } from 'sqids';
import { getAppSetting } from '~/queries/appSettings';

export type ParsedToken = {
  apiKey: string;
  appId: string;
  regions: string[];
  ingestHost: string;
};

/**
 * Parse the UploadThing token to extract appId, apiKey, and region info
 */
export async function parseUploadThingToken(): Promise<ParsedToken | null> {
  const token = await getAppSetting('uploadThingToken');

  if (!token) {
    return null;
  }

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

// Algorithms from: https://docs.uploadthing.com/uploading-files#generating-presigned-urls

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

function encodeBase64(str: string): string {
  return Buffer.from(str).toString('base64url');
}

function generateKey(appId: string, fileSeed: string) {
  // Hash and Encode the parts and apiKey as sqids
  const alphabet = shuffle(defaultOptions.alphabet, appId);
  const encodedAppId = new Sqids({ alphabet, minLength: 12 }).encode([
    Math.abs(djb2(appId)),
  ]);
  // We use a base64 encoding here to ensure the file seed is url safe, but
  // you can do this however you want
  const encodedFileSeed = encodeBase64(fileSeed);
  return `${encodedAppId}${encodedFileSeed}`;
}

type GeneratePresignedUrlOptions = {
  fileName: string;
  fileSize: number;
  /** TTL in milliseconds, defaults to 1 hour */
  ttl?: number;
  tokenData: ParsedToken;
};

type PresignedUrlResult = {
  uploadUrl: string;
  fileKey: string;
  fileUrl: string;
  expiresAt: number;
};

/**
 * Generate a presigned URL for direct upload to UploadThing
 */
export function generatePresignedUploadUrl(
  options: GeneratePresignedUrlOptions,
): PresignedUrlResult {
  const { fileName, fileSize, ttl = 60 * 60 * 1000, tokenData } = options;

  const { apiKey, appId, regions, ingestHost } = tokenData;

  // Generate a unique file seed based on file properties and timestamp
  const fileSeed = `${fileName}-${fileSize}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const fileKey = generateKey(appId, fileSeed);

  // Build the presigned URL
  const region = regions[0] ?? 'sea1';
  const expiresAt = Date.now() + ttl;

  const searchParams = new URLSearchParams({
    'expires': String(expiresAt),
    'x-ut-identifier': appId,
    'x-ut-file-name': fileName,
    'x-ut-file-size': String(fileSize),
    'x-ut-slug': 'assetRouter', // Use the existing file router slug
    'x-ut-content-disposition': 'inline',
    'x-ut-acl': 'public-read',
  });

  // Construct the base URL
  const baseUrl = `https://${region}.${ingestHost}/${fileKey}`;
  const urlWithParams = `${baseUrl}?${searchParams.toString()}`;

  // Sign the URL
  const signature = `hmac-sha256=${hmacSha256(urlWithParams, apiKey)}`;
  const finalUrl = `${urlWithParams}&signature=${encodeURIComponent(signature)}`;

  // The URL where the file will be accessible after upload
  const fileUrl = `https://${appId}.ufs.sh/f/${fileKey}`;

  return {
    uploadUrl: finalUrl,
    fileKey,
    fileUrl,
    expiresAt,
  };
}
