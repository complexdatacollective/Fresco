import { Effect, Queue, Stream } from 'effect';
import { addEvent } from '~/actions/activityFeed';
import { safeRevalidateTag } from '~/lib/cache';
import { type ExportEvent, formatSSE } from '~/lib/export/exportEvents';
import { ExportLayer } from '~/lib/export/layers/ExportLayer';
import { exportPipeline } from '~/lib/export/pipeline';
import {
  captureEvent,
  captureException,
  shutdownPostHog,
} from '~/lib/posthog-server';
import { exportInterviewsSchema } from '~/schemas/export';
import { requireApiAuth } from '~/utils/auth';

export async function POST(request: Request) {
  try {
    await requireApiAuth();
  } catch {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
    });
  }

  const body: unknown = await request.json();
  const parsed = exportInterviewsSchema.safeParse(body);

  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
    });
  }

  const { interviewIds, exportOptions } = parsed.data;

  const program = Effect.gen(function* () {
    const queue = yield* Queue.unbounded<ExportEvent>();

    yield* exportPipeline(interviewIds, exportOptions, queue).pipe(
      Effect.tap((result) =>
        Effect.sync(() => {
          safeRevalidateTag(['getInterviews', 'activityFeed']);
          void addEvent(
            'Data Exported',
            `Exported data for ${String(interviewIds.length)} interview(s)`,
          );
          void captureEvent('Data Exported', {
            interviewCount: interviewIds.length,
          }).then(() => shutdownPostHog());
        }).pipe(
          Effect.andThen(
            Queue.offer(queue, {
              type: 'complete',
              zipUrl: result.zipUrl ?? '',
              zipKey: result.zipKey ?? '',
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
              message: error.userMessage,
            }),
          ),
        ),
      ),
      Effect.catchAll(() => Effect.void),
      Effect.ensuring(Queue.shutdown(queue)),
      Effect.provide(ExportLayer),
      Effect.fork,
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
