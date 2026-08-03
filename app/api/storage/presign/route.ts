import { Effect } from 'effect';
import { z } from 'zod';
import { requireApiAuth } from '~/lib/auth/guards';
import { getStorageLayer } from '~/lib/storage/layers/StorageLayer';
import { AssetStorage } from '~/lib/storage/services/AssetStorage';
import { getStorageProvider } from '~/queries/storageProvider';

const requestSchema = z.object({
  files: z.array(
    z.object({
      name: z.string(),
      size: z.number().positive(),
    }),
  ),
});

export async function POST(request: Request) {
  try {
    await requireApiAuth();
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const provider = await getStorageProvider();

  // UploadThing's ingest protocol is not a plain presigned-PUT; the client
  // must use the UploadThing SDK's uploader directly, which hits
  // /api/uploadthing. We only generate presigned URLs for S3.
  if (provider === 'uploadthing') {
    return Response.json({ provider: 'uploadthing' });
  }

  try {
    const storageLayer = await getStorageLayer();

    const urls = await Effect.gen(function* () {
      const assetStorage = yield* AssetStorage;
      return yield* assetStorage.generatePresignedUploadUrls(parsed.data.files);
    }).pipe(Effect.provide(storageLayer), Effect.runPromise);

    return Response.json({ provider: 's3', urls });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to generate presigned URLs:', error);
    return Response.json(
      { error: 'Failed to generate upload URLs' },
      { status: 500 },
    );
  }
}
