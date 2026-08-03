import { createUploadthing } from 'uploadthing/next';
import { getServerSession } from '~/lib/auth/guards';

const f = createUploadthing();

export const ourFileRouter = {
  // `blob` intentionally accepts any media type: Network Canvas protocol assets
  // span images/audio/video and rejecting types would break valid protocols.
  // UploadThing serves uploads from its own (cross-origin) domain, so an
  // uploaded SVG/HTML cannot execute in the Fresco origin. The same-origin S3
  // serving path is hardened separately in app/api/assets/[key]/route.ts
  // (validated content-type, nosniff, and attachment disposition for
  // script-capable types).
  assetRouter: f({
    blob: { maxFileSize: '256MB', maxFileCount: 50 },
  })
    .middleware(async () => {
      const session = await getServerSession();
      if (!session) {
        throw new Error('You must be logged in to upload assets.');
      }
      return {};
    })
    .onUploadComplete(() => undefined),
};

export type OurFileRouter = typeof ourFileRouter;
