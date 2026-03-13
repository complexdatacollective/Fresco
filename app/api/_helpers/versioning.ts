import { type HTTP_METHOD } from 'next/dist/server/web/http';
import { type NextRequest } from 'next/server';

type Handler = (request: NextRequest) => Response | Promise<Response>;

export function createVersionedHandler(
  handlers: Record<string, Record<string, Handler>>,
  method: HTTP_METHOD,
) {
  return async (
    request: NextRequest,
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
