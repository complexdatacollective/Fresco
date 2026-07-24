import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { prisma } from '~/lib/db';
import { getS3Bucket, getS3PublicClient } from '~/lib/storage/layers/S3Client';

// Must exceed the longest plausible interview session so cached redirect
// targets keep working for ranged media requests.
const PRESIGN_EXPIRY_SECONDS = 60 * 60 * 24;
// Much shorter than the presign expiry: if credentials or bucket config
// rotate, browsers re-request a fresh redirect within this window (bounded
// staleness), while already-cached redirects keep working for ranged media
// requests because the signed URL itself stays valid for the full expiry.
const REDIRECT_CACHE_SECONDS = 60 * 60;

// Keys we mint are `${uuid}${ext}` — never a path. Anything else is rejected so
// this route cannot be used to sign a GET for an arbitrary object name.
const KEY_PATTERN = /^[A-Za-z0-9._-]+$/;

// Map known extensions to a content type we serve verbatim, so a file's stored
// (browser-supplied) content type can't be sniffed into something executable.
const CONTENT_TYPE_BY_EXT: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.bmp': 'image/bmp',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.ogg': 'video/ogg',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.m4a': 'audio/mp4',
  '.pdf': 'application/pdf',
};

// Types that can execute script when opened as a top-level document. We force
// `attachment` for these (and for unknown types) so they download instead of
// rendering in the Fresco origin. Inline embedding via <img>/<video>/<audio>
// ignores Content-Disposition, so legitimate media still displays.
const INLINE_SAFE_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.avif',
  '.bmp',
  '.mp4',
  '.webm',
  '.mov',
  '.ogg',
  '.mp3',
  '.wav',
  '.m4a',
  '.pdf',
]);

function getExtension(key: string): string {
  const match = /\.[^.]+$/.exec(key);
  return match ? match[0].toLowerCase() : '';
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params;

  if (!key || key.length > 256 || !KEY_PATTERN.test(key)) {
    return Response.json({ error: 'Invalid asset key' }, { status: 400 });
  }

  // Only sign GETs for keys actually referenced by a stored asset or a
  // protocol's original file. Without this the route is an oracle that will
  // sign a GET for any object name in the bucket.
  const asset = await prisma.asset.findUnique({
    where: { key },
    select: { key: true },
  });
  let permitted = asset !== null;
  if (!permitted) {
    const protocol = await prisma.protocol.findFirst({
      where: { originalFileKey: key },
      select: { id: true },
    });
    permitted = protocol !== null;
  }
  if (!permitted) {
    return Response.json({ error: 'Asset not found' }, { status: 404 });
  }

  try {
    const [client, bucket] = await Promise.all([
      getS3PublicClient(),
      getS3Bucket(),
    ]);

    const ext = getExtension(key);
    const disposition = INLINE_SAFE_EXTENSIONS.has(ext)
      ? 'inline'
      : 'attachment';
    const contentType = CONTENT_TYPE_BY_EXT[ext] ?? 'application/octet-stream';

    const url = await getSignedUrl(
      client,
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
        ResponseContentDisposition: disposition,
        ResponseContentType: contentType,
      }),
      { expiresIn: PRESIGN_EXPIRY_SECONDS },
    );

    return new Response(null, {
      status: 307,
      headers: {
        'Location': url,
        'Cache-Control': `private, max-age=${REDIRECT_CACHE_SECONDS}`,
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return Response.json({ error: 'Asset unavailable' }, { status: 404 });
  }
}
