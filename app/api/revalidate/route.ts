import { revalidatePath, revalidateTag } from 'next/cache';

type RequestData = { tag?: string; path?: string };

// Route handler for triggering revalidation based on a tag or a path from client components
export async function POST(request: Request) {
  const { tag, path } = (await request.json()) as RequestData;

  if (tag) {
    revalidateTag(tag);
    return Response.json({ revalidated: true, now: Date.now() });
  }

  if (path) {
    revalidatePath(path);
    return Response.json({ revalidated: true, now: Date.now() });
  }

  return Response.json({ revalidated: false, now: Date.now() });
}
