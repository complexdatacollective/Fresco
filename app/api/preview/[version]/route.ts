import { type HTTP_METHOD } from 'next/dist/server/web/http';
import { NextResponse } from 'next/server';
import { v1 } from './_handlers/v1/handler';
import { corsHeaders } from './_handlers/v1/helpers';

// Preflight options are always accepted with CORS headers
export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

type Handler = (request: Request) => Response | Promise<Response>;

const handlers: Record<string, Record<string, Handler>> = {
  v1: { GET: v1 },
};

function createVersionedHandler(method: HTTP_METHOD) {
  return async (
    request: Request,
    { params }: { params: Promise<{ version: string }> },
  ) => {
    const { version } = await params;

    const versionHandlers = handlers[version];
    if (!versionHandlers) {
      return Response.json(
        { error: `Unsupported API version: ${version}` },
        { status: 404 },
      );
    }

    const handler = versionHandlers[method];
    if (!handler) {
      return Response.json(
        { error: `${method} not supported in ${version}` },
        { status: 405 },
      );
    }

    return handler(request);
  };
}

export const POST = createVersionedHandler('POST');
