import { createUploadthing } from 'uploadthing/next';
import { UTApi } from 'uploadthing/server';
import { getServerSession } from '~/utils/auth';

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  assetRouter: f({
    blob: { maxFileSize: '256MB', maxFileCount: 10 },
  })
    .middleware(async () => {
      const session = await getServerSession();
      if (!session) {
        throw new Error('You must be logged in to upload assets.');
      }
      return {};
    })
    .onUploadError((error) => {
      console.log('assetRouter onUploadError', error);
    })
    .onUploadComplete((file) => {
      console.log('assetRouter onUploadComplete', file);
    }),
};

export const utapi = new UTApi();

export type OurFileRouter = typeof ourFileRouter;
