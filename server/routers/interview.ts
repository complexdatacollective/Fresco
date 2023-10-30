/* eslint-disable local-rules/require-data-mapper */
import { prisma } from '~/utils/db';
import { publicProcedure, protectedProcedure, router } from '~/server/trpc';
import { participantIdentifierSchema } from '~/shared/schemas';
import { z } from 'zod';
import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
} from '@codaco/shared-consts';
import { Prisma } from '@prisma/client';

const NcEntityZod = z.object({
  [entityPrimaryKeyProperty]: z.string().readonly(),
  type: z.string().optional(),
  [entityAttributesProperty]: z.record(z.string(), z.any()),
});

const NcNodeZod = NcEntityZod.extend({
  type: z.string(),
  stageId: z.string().optional(),
  promptIDs: z.array(z.string()).optional(),
  displayVariable: z.string().optional(),
});

const NcEdgeZod = NcEntityZod.extend({
  type: z.string(),
  from: z.string(),
  to: z.string(),
});

const NcNetworkZod = z.object({
  nodes: z.array(NcNodeZod),
  edges: z.array(NcEdgeZod),
  ego: NcEntityZod.optional(),
});

export const interviewRouter = router({
  create: publicProcedure
    .input(participantIdentifierSchema)
    .mutation(async ({ input: identifier }) => {
      try {
        // get the active protocol id to connect to the interview
        const activeProtocol = await prisma.protocol.findFirst({
          where: { active: true },
        });

        if (!activeProtocol) {
          return {
            errorType: 'NO_ACTIVE_PROTOCOL',
            error: 'Failed to create interview: no active protocol',
            createdInterview: null,
          };
        }

        const existingInterview = await prisma.interview.findFirst({
          where: {
            participant: {
              identifier,
            },
          },
        });

        if (existingInterview) {
          return {
            errorType: 'IDENTIFIER_IN_USE',
            error: 'Identifier is already in use',
            createdInterview: null,
          };
        }

        const createdInterview = await prisma.interview.create({
          data: {
            startTime: new Date(),
            lastUpdated: new Date(),
            currentStep: 0,
            network: Prisma.JsonNull,
            participant: {
              create: {
                identifier: identifier,
              },
            },
            protocol: {
              connect: {
                id: activeProtocol.id,
              },
            },
          },
        });

        return { error: null, createdInterview, errorType: null };
      } catch (error) {
        return {
          errorType: 'UNKNOWN',
          error: 'Failed to create interview',
          createdInterview: null,
        };
      }
    }),
  updateNetwork: publicProcedure
    .input(
      z.object({
        interviewId: z.string().cuid(),
        network: NcNetworkZod,
      }),
    )
    .mutation(async ({ input: { interviewId, network } }) => {
      try {
        const updatedInterview = await prisma.interview.update({
          where: {
            id: interviewId,
          },
          data: {
            network,
          },
        });

        return { error: null, updatedInterview };
      } catch (error) {
        return { error: 'Failed to update interview', updatedInterview: null };
      }
    }),
  get: router({
    all: publicProcedure.query(async () => {
      try {
        const interviews = await prisma.interview.findMany({
          include: {
            protocol: true,
            participant: true,
          },
        });
        return interviews;
      } catch (error) {
        return { error: 'Failed to fetch interviews', interviews: null };
      }
    }),
    byId: publicProcedure
      .input(
        z.object({
          id: z.string(),
        }),
      )
      .query(async ({ input: id }) => {
        try {
          const interview = await prisma.interview.findFirst({
            where: id,
            include: {
              protocol: true,
              participant: true,
            },
          });
          return interview;
        } catch (error) {
          return { error: 'Failed to fetch interview by ID', interview: null };
        }
      }),
  }),
  delete: protectedProcedure
    .input(
      z.array(
        z.object({
          id: z.string(),
        }),
      ),
    )
    .mutation(async ({ input: data }) => {
      const idsToDelete = data.map((p) => p.id);

      try {
        // eslint-disable-next-line local-rules/require-data-mapper
        const deletedInterviews = await prisma.interview.deleteMany({
          where: {
            id: {
              in: idsToDelete,
            },
          },
        });
        return { error: null, interview: deletedInterviews };
      } catch (error) {
        return { error: 'Failed to delete interviews', interview: null };
      }
    }),
});
