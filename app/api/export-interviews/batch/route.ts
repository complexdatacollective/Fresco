import { after } from 'next/server';
import { Effect, Fiber, Layer, Queue, Ref } from 'effect';
import { type ExportEvent } from '@codaco/network-exporters/events';
import { exportPipeline } from '@codaco/network-exporters/pipeline';
import { requireApiAuth } from '~/lib/auth/guards';
import { prisma } from '~/lib/db';
import { makeFileStreamOutputLayer } from '~/lib/export/FileStreamOutput';
import { PrismaInterviewRepository } from '~/lib/export/InterviewRepository';
import { PrismaProtocolRepository } from '~/lib/export/ProtocolRepository';
import { encodeExportEvent } from '~/lib/export/streamProtocol';
import { captureException, shutdownPostHog } from '~/lib/posthog-server';
import { exportInterviewsSchema } from '~/schemas/export';

export async function POST(request: Request) {
  try {
    await requireApiAuth();
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = exportInterviewsSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const interviewIds = [...new Set(parsed.data.interviewIds)];
  const { exportOptions } = parsed.data;

  // Defense-in-depth: the client orchestrator batches at EXPORT_BATCH_SIZE
  // (200). Reject an oversized direct request so a single invocation can't
  // recreate the serverless time/memory failure this batching design avoids.
  const MAX_BATCH_INTERVIEWS = 500;
  if (interviewIds.length > MAX_BATCH_INTERVIEWS) {
    return Response.json(
      {
        error: `Too many interviews in one batch (max ${String(MAX_BATCH_INTERVIEWS)})`,
      },
      { status: 413 },
    );
  }

  const count = await prisma.interview.count({
    where: { id: { in: interviewIds } },
  });
  if (count !== interviewIds.length) {
    return Response.json(
      { error: 'One or more interviews not found' },
      { status: 404 },
    );
  }

  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();

  const exportLayer = Layer.mergeAll(
    PrismaInterviewRepository,
    PrismaProtocolRepository,
    makeFileStreamOutputLayer(writer),
  );

  const program = Effect.gen(function* () {
    const queue = yield* Queue.unbounded<ExportEvent>();

    // Coalesce progress to one frame per integer percent (a large batch emits
    // one per file); always forward stage events.
    const lastPct = yield* Ref.make(-1);
    const progressFiber = yield* Effect.fork(
      Effect.forever(
        Queue.take(queue).pipe(
          Effect.flatMap((event) => {
            if (event.type === 'stage') {
              return Effect.promise(() =>
                writer.write(encodeExportEvent(event)),
              );
            }
            const pct =
              event.total > 0
                ? Math.round((event.current / event.total) * 100)
                : 0;
            return Ref.getAndSet(lastPct, pct).pipe(
              Effect.flatMap((prev) =>
                prev === pct
                  ? Effect.void
                  : Effect.promise(() =>
                      writer.write(encodeExportEvent(event)),
                    ),
              ),
            );
          }),
        ),
      ),
    );

    const result = yield* exportPipeline(interviewIds, exportOptions, queue);

    yield* Fiber.interrupt(progressFiber);
    const remaining = yield* Queue.takeAll(queue);
    yield* Effect.forEach(remaining, (event) =>
      Effect.promise(() => writer.write(encodeExportEvent(event))),
    );

    return result;
  }).pipe(
    Effect.tap((result) =>
      Effect.promise(async () => {
        const failedSessionIds = [
          ...new Set(result.failedExports.map((failure) => failure.sessionId)),
        ];
        await writer.write(
          encodeExportEvent({ type: 'complete', failedSessionIds }),
        );
        await writer.close();
      }),
    ),
    Effect.tapError((error) =>
      Effect.promise(async () => {
        const message =
          error instanceof Error ? error.message : 'Export failed';
        await writer
          .write(encodeExportEvent({ type: 'error', message }))
          .catch(() => undefined);
        await writer.close().catch(() => undefined);
        await captureException(error);
        await shutdownPostHog();
      }),
    ),
    Effect.catchAll(() => Effect.void),
    Effect.provide(exportLayer),
  );

  const fiber = Effect.runFork(program);

  request.signal.addEventListener('abort', () => {
    Effect.runFork(Fiber.interrupt(fiber));
    void writer.close().catch(() => undefined);
  });

  // Keep the function alive on the platform until the run settles.
  after(() => Fiber.await(fiber).pipe(Effect.runPromise));

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-store',
    },
  });
}
