import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { getDefaultSession } from '~/server/context';

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  protocolUploader: f({
    'application/zip': { maxFileSize: '256MB', maxFileCount: 5 },
  })
    // Set permissions and file types for this FileRoute
    .middleware(async () => {
      const session = await getDefaultSession();
      if (!session?.user) {
        throw new Error('Unauthorized');
      }
      return {};
    })
    .onUploadComplete(async () => {}),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
