import { after } from 'next/server';
import { Effect, Fiber, Layer, Queue } from 'effect';
import { type ExportEvent } from '@codaco/network-exporters/events';
import { exportPipeline } from '@codaco/network-exporters/pipeline';
import { addEvent } from '~/actions/activityFeed';
import { requireApiAuth } from '~/lib/auth/guards';
import { safeRevalidateTag } from '~/lib/cache';
import { prisma } from '~/lib/db';
import { PrismaInterviewRepository } from '~/lib/export/InterviewRepository';
import { makeHttpOutputLayer } from '~/lib/export/Output';
import { PrismaProtocolRepository } from '~/lib/export/ProtocolRepository';
import { encodeExportEvent } from '~/lib/export/streamProtocol';
import { consumeExportTicket } from '~/lib/export/tickets';
import {
  captureEvent,
  captureException,
  shutdownPostHog,
} from '~/lib/posthog-server';

export async function GET(request: Request) {
  let username: string;
  let userId: string;
  try {
    const session = await requireApiAuth();
    username = session.user.username;
    userId = session.user.userId;
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ticketId = new URL(request.url).searchParams.get('ticket');
  if (!ticketId) {
    return Response.json({ error: 'Missing ticket' }, { status: 400 });
  }

  const params = await consumeExportTicket(ticketId, userId);
  if (!params) {
    return Response.json(
      { error: 'Invalid or expired export ticket' },
      { status: 404 },
    );
  }

  const { interviewIds, exportOptions } = params;
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();

  const exportLayer = Layer.mergeAll(
    PrismaInterviewRepository,
    PrismaProtocolRepository,
    makeHttpOutputLayer(writer),
  );

  const program = Effect.gen(function* () {
    const queue = yield* Queue.unbounded<ExportEvent>();

    // Drain progress events to the client concurrently with the zip data.
    // Each event is one writer.write() call, so the shared writer serializes
    // progress and data frames without interleaving.
    const progressFiber = yield* Effect.fork(
      Effect.forever(
        Queue.take(queue).pipe(
          Effect.flatMap((event) =>
            Effect.promise(() => writer.write(encodeExportEvent(event))),
          ),
        ),
      ),
    );

    yield* exportPipeline(interviewIds, exportOptions, queue);

    // Stop draining, then flush any progress events buffered after the last take.
    yield* Fiber.interrupt(progressFiber);
    const remaining = yield* Queue.takeAll(queue);
    yield* Effect.forEach(remaining, (event) =>
      Effect.promise(() => writer.write(encodeExportEvent(event))),
    );
  }).pipe(
    Effect.tap(() =>
      Effect.promise(async () => {
        await writer.write(encodeExportEvent({ type: 'complete' }));
        await writer.close();
        await prisma.interview.updateMany({
          where: { id: { in: interviewIds } },
          data: { exportTime: new Date() },
        });
        safeRevalidateTag(['getInterviews', 'activityFeed']);
        await addEvent(
          'Data Exported',
          `User ${username} exported data for ${String(interviewIds.length)} interview(s)`,
        );
        await captureEvent('Data Exported', {
          interviewCount: interviewIds.length,
        });
        await shutdownPostHog();
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

  // If the client aborts (cancel button or navigation), interrupt the run and
  // close the stream; exportTime is never set, so a cancelled export is not
  // marked exported.
  request.signal.addEventListener('abort', () => {
    Effect.runFork(Fiber.interrupt(fiber));
    void writer.close().catch(() => undefined);
  });

  // Keep the function alive on Vercel until post-success side effects finish.
  after(() => Fiber.await(fiber).pipe(Effect.runPromise));

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-store',
    },
  });
}
