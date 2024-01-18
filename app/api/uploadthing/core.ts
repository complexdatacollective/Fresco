import { getAuth } from '@clerk/nextjs/server';
import { createUploadthing } from 'uploadthing/next';
import { UTApi } from 'uploadthing/server';

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  assetRouter: f({
    blob: { maxFileSize: '256MB', maxFileCount: 50 },
  })
    .middleware(async ({ req, res }) => {
      const session = getAuth(req);
      if (!session) {
        throw new Error('You must be logged in to upload assets.');
      }
      return {};
    })
    .onUploadComplete(() => undefined),
};

export const utapi = new UTApi();

export type OurFileRouter = typeof ourFileRouter;
