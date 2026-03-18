import { createId } from '@paralleldrive/cuid2';
import { addEvent } from '~/actions/activityFeed';
import { safeRevalidateTag } from '~/lib/cache';
import { prisma } from '~/lib/db';
import { generateNetwork } from '~/lib/synthetic-interviews/generateNetwork';
import { generateSyntheticInterviewsSchema } from '~/schemas/synthetic-interviews';
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
  const parsed = generateSyntheticInterviewsSchema.safeParse(body);

  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
    });
  }

  const { protocolId, count } = parsed.data;

  const protocol = await prisma.protocol.findUnique({
    where: { id: protocolId },
  });

  if (!protocol) {
    return new Response(JSON.stringify({ error: 'Protocol not found' }), {
      status: 404,
    });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        for (let i = 0; i < count; i++) {
          const { network, stageMetadata } = generateNetwork(
            protocol.codebook as Parameters<typeof generateNetwork>[0],
            protocol.stages as Parameters<typeof generateNetwork>[1],
          );

          const participantIdentifier = `test-${createId()}`;

          // Timestamps don't need seeded reproducibility — each interview
          // should have a unique, plausible time regardless of seed.
          const startTime = new Date(
            Date.now() - Math.floor(Math.random() * 3600000),
          );
          const finishTime = new Date(
            startTime.getTime() + Math.floor(Math.random() * 1800000) + 300000,
          );

          const stages = protocol.stages as { id: string }[];

          await prisma.interview.create({
            data: {
              network: network as object,
              currentStep: stages.length,
              startTime,
              finishTime,
              isSynthetic: true,
              stageMetadata: stageMetadata as object | undefined,
              participant: {
                create: {
                  identifier: participantIdentifier,
                  label: participantIdentifier,
                  isSynthetic: true,
                },
              },
              protocol: {
                connect: { id: protocolId },
              },
            },
          });

          send({ type: 'progress', current: i + 1, total: count });
        }

        safeRevalidateTag([
          'getInterviews',
          'getParticipants',
          'interviewCount',
          'participantCount',
          'summaryStatistics',
          'activityFeed',
        ]);

        void addEvent(
          'Synthetic Data Generated',
          `Generated ${String(count)} synthetic interviews for protocol "${protocol.name}"`,
        );

        send({ type: 'complete', created: count });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        send({ type: 'error', message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
