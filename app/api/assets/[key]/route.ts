import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getS3Bucket, getS3PublicClient } from '~/lib/storage/layers/S3Client';

// Must exceed the longest plausible interview session so cached redirect
// targets keep working for ranged media requests.
const PRESIGN_EXPIRY_SECONDS = 60 * 60 * 24;
const REDIRECT_CACHE_SECONDS = 60 * 60;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params;

  try {
    const [client, bucket] = await Promise.all([
      getS3PublicClient(),
      getS3Bucket(),
    ]);

    const url = await getSignedUrl(
      client,
      new GetObjectCommand({ Bucket: bucket, Key: key }),
      { expiresIn: PRESIGN_EXPIRY_SECONDS },
    );

    return new Response(null, {
      status: 307,
      headers: {
        'Location': url,
        'Cache-Control': `private, max-age=${REDIRECT_CACHE_SECONDS}`,
      },
    });
  } catch {
    return Response.json({ error: 'Asset unavailable' }, { status: 404 });
  }
}
