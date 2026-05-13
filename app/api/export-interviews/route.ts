import { Effect, Layer, Queue, Stream } from 'effect';
import { exportPipeline } from '@codaco/network-exporters/pipeline';
import { type stageMessages } from '@codaco/network-exporters/events';
import { addEvent } from '~/actions/activityFeed';
import { requireApiAuth } from '~/lib/auth/guards';
import { safeRevalidateTag } from '~/lib/cache';
import { describeExportError } from '~/lib/export/errors';
import { PrismaInterviewRepository } from '~/lib/export/InterviewRepository';
import { PrismaProtocolRepository } from '~/lib/export/ProtocolRepository';
import { makeProductionOutputLayer } from '~/lib/export/Output';
import { formatSSE, type ExportSseEvent } from '~/lib/export/sseEvents';
import {
  captureEvent,
  captureException,
  shutdownPostHog,
} from '~/lib/posthog-server';
import { getStorageProvider } from '~/queries/storageProvider';
import { exportInterviewsSchema } from '~/schemas/export';

// Fresco user-facing copy for each package stage. Keys must cover every
// ExportStage emitted by @codaco/network-exporters/events.
const stageCopy: Record<keyof typeof stageMessages, string> = {
  fetching: 'Fetching interview data...',
  formatting: 'Formatting sessions...',
  generating: 'Generating files...',
  outputting: 'Creating archive...',
};

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

  const outputLayer = makeProductionOutputLayer(await getStorageProvider());

  const exportLayer = Layer.mergeAll(
    PrismaInterviewRepository,
    PrismaProtocolRepository,
    outputLayer,
  );

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
              zipUrl: result.output.url ?? '',
              zipKey: result.output.key ?? '',
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
      Effect.provide(exportLayer),
      Effect.forkDaemon,
    );

    const encoder = new TextEncoder();
    const sseStream = Stream.fromQueue(queue).pipe(
      // Replace the package's stage message with Fresco copy on the wire.
      Stream.map((event) =>
        event.type === 'stage'
          ? { ...event, message: stageCopy[event.stage] ?? event.message }
          : event,
      ),
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
