import { Effect, Queue, Stream } from 'effect';
import { addEvent } from '~/actions/activityFeed';
import { requireApiAuth } from '~/lib/auth/guards';
import { safeRevalidateTag } from '~/lib/cache';
import { formatSSE, type ExportSseEvent } from './sse';
import { describeExportError } from '~/lib/network-exporters/errors';
import { exportPipeline } from '~/lib/network-exporters/pipeline';
import {
  captureEvent,
  captureException,
  shutdownPostHog,
} from '~/lib/posthog-server';
import { getStorageLayer } from '~/lib/storage/layers/StorageLayer';
import { exportInterviewsSchema } from '~/schemas/export';

export async function POST(request: Request) {
  let username: string;
  try {
    const session = await requireApiAuth();
    username = session.user.username;
  } catch {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
    });
  }

  const parsed = exportInterviewsSchema.safeParse(body);

  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
    });
  }

  const { interviewIds, exportOptions } = parsed.data;

  const storageLayer = await getStorageLayer();

  const program = Effect.gen(function* () {
    const queue = yield* Queue.unbounded<ExportSseEvent>();

    yield* exportPipeline(interviewIds, exportOptions, queue).pipe(
      Effect.tap((result) =>
        Effect.sync(() => {
          safeRevalidateTag(['getInterviews', 'activityFeed']);
          void addEvent(
            'Data Exported',
            `${username} exported data for ${String(interviewIds.length)} interview(s)`,
          );
          void captureEvent('Data Exported', {
            interviewCount: interviewIds.length,
          }).then(() => shutdownPostHog());
        }).pipe(
          Effect.andThen(
            Queue.offer(queue, {
              type: 'complete',
              zipUrl: result.zipUrl,
              zipKey: result.zipKey,
            }),
          ),
        ),
      ),
      Effect.tapError((error) =>
        Effect.sync(() => {
          void captureException(error).then(() => shutdownPostHog());
        }).pipe(
          Effect.andThen(
            Queue.offer(queue, {
              type: 'error',
              message: describeExportError(error),
            }),
          ),
        ),
      ),
      Effect.catchAll(() => Effect.void),
      Effect.ensuring(Queue.shutdown(queue)),
      Effect.provide(storageLayer),
      Effect.forkDaemon,
    );

    const encoder = new TextEncoder();
    const sseStream = Stream.fromQueue(queue).pipe(
      Stream.map((event) => encoder.encode(formatSSE(event))),
    );

    return Stream.toReadableStream(sseStream);
  });

  const readableStream = await Effect.runPromise(program);

  return new Response(readableStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
