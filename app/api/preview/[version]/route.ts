import { type NextRequest, NextResponse } from 'next/server';

async function redirect(
  request: NextRequest,
  { params }: { params: Promise<{ version: string }> },
) {
  const { version } = await params;
  const url = request.nextUrl.clone();
  url.pathname = `/api/${version}/preview`;
  return NextResponse.redirect(url, 308);
}

export const POST = redirect;
export const OPTIONS = redirect;
