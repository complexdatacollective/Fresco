import { revalidatePath, revalidateTag } from 'next/cache';

// Route handler for triggering revalidation based on a tag or a path from client components
export async function POST(request: Request) {
  const { tag, path } = await request.json();

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
