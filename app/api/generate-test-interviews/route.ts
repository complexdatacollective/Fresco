import { createId } from '@paralleldrive/cuid2';
import { addEvent } from '~/actions/activityFeed';
import { requireApiAuth } from '~/lib/auth/guards';
import { prisma } from '~/lib/db';
import { generateNetwork } from '@codaco/interview';
import { generateSyntheticInterviewsSchema } from '~/schemas/synthetic-interviews';

export async function POST(request: Request) {
  try {
    await requireApiAuth();
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

  const parsed = generateSyntheticInterviewsSchema.safeParse(body);

  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
    });
  }

  const { protocolId, count, simulateDropOut, respectSkipLogicAndFiltering } =
    parsed.data;

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
        const stages = protocol.stages as { id: string }[];
        const typedStages = stages as Parameters<typeof generateNetwork>[1];
        const typedCodebook = protocol.codebook as Parameters<
          typeof generateNetwork
        >[0];

        const genOptions = { simulateDropOut, respectSkipLogicAndFiltering };

        let completedCount = 0;
        const incompleteInterviewIds: string[] = [];

        for (let i = 0; i < count; i++) {
          const { network, stageMetadata, currentStep, droppedOut } =
            generateNetwork(typedCodebook, typedStages, undefined, genOptions);

          const isCompleted = !droppedOut;
          if (isCompleted) {
            completedCount++;
          }

          const participantIdentifier = `test-${createId()}`;
          const startTime = new Date(
            Date.now() - Math.floor(Math.random() * 3600000),
          );
          const finishTime = isCompleted
            ? new Date(
                startTime.getTime() +
                  Math.floor(Math.random() * 1800000) +
                  300000,
              )
            : null;

          const created = await prisma.interview.create({
            data: {
              network: network as object,
              currentStep,
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

          if (!isCompleted) {
            incompleteInterviewIds.push(created.id);
          }

          send({ type: 'progress', current: i + 1, total: count });
        }

        // Enforce 10% minimum completion when drop-out is enabled.
        // Regenerate incomplete interviews from this batch with drop-out
        // disabled and update them in-place.
        if (simulateDropOut) {
          const minCompleted = Math.max(1, Math.ceil(count * 0.1));

          if (completedCount < minCompleted) {
            const deficit = minCompleted - completedCount;
            const toFix = incompleteInterviewIds.slice(0, deficit);

            const incompleteInterviews = await prisma.interview.findMany({
              where: { id: { in: toFix } },
              select: { id: true, startTime: true },
            });

            for (const interview of incompleteInterviews) {
              const { network, stageMetadata, currentStep } = generateNetwork(
                typedCodebook,
                typedStages,
                undefined,
                {
                  ...genOptions,
                  simulateDropOut: false,
                },
              );

              await prisma.interview.update({
                where: { id: interview.id },
                data: {
                  network: network as object,
                  currentStep,
                  stageMetadata: stageMetadata as object | undefined,
                  finishTime: new Date(
                    interview.startTime.getTime() +
                      Math.floor(Math.random() * 1800000) +
                      300000,
                  ),
                },
              });
            }
          }
        }

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
