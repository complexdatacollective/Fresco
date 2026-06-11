import { after } from 'next/server';
import { Effect, Layer, Queue } from 'effect';
import { type ExportEvent } from '@codaco/network-exporters/events';
import { exportPipeline } from '@codaco/network-exporters/pipeline';
import { addEvent } from '~/actions/activityFeed';
import { requireApiAuth } from '~/lib/auth/guards';
import { safeRevalidateTag } from '~/lib/cache';
import { prisma } from '~/lib/db';
import { PrismaInterviewRepository } from '~/lib/export/InterviewRepository';
import { makeHttpOutputLayer } from '~/lib/export/Output';
import { PrismaProtocolRepository } from '~/lib/export/ProtocolRepository';
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

  const exportLayer = Layer.mergeAll(
    PrismaInterviewRepository,
    PrismaProtocolRepository,
    makeHttpOutputLayer(writable),
  );

  const program = Effect.gen(function* () {
    // The pipeline requires a progress queue; nothing consumes it here, so a
    // sliding queue of capacity 1 keeps it from accumulating events.
    const queue = yield* Queue.sliding<ExportEvent>(1);
    yield* exportPipeline(interviewIds, exportOptions, queue);
  }).pipe(
    Effect.tap(() =>
      Effect.promise(async () => {
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
        // Abort first so the browser surfaces a failed download instead of hanging.
        await writable.abort(error).catch(() => undefined);
        await captureException(error);
        await shutdownPostHog();
      }),
    ),
    Effect.catchAll(() => Effect.void),
    Effect.provide(exportLayer),
  );

  // Defects (rejections inside Effect.promise taps, pipeline bugs) bypass
  // tapError/catchAll and reject the runPromise, so abort the stream here too.
  const run = Effect.runPromise(program).catch(async (defect: unknown) => {
    await writable.abort(defect).catch(() => undefined);
    await captureException(defect);
    await shutdownPostHog();
  });
  // Registering the already-started promise with `after` extends the function
  // lifetime on Vercel so post-success side effects aren't cut off when the
  // response stream finishes.
  after(() => run);

  const date = new Date().toISOString().slice(0, 10);
  return new Response(readable, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="fresco-export-${date}.zip"`,
      'Cache-Control': 'no-store',
    },
  });
}
