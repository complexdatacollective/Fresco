import { createUploadthing } from 'uploadthing/next';
import { getServerSession } from '~/utils/auth';

const f = createUploadthing();

export const ourFileRouter = {
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
