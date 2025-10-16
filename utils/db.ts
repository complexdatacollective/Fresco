import { VersionedProtocolSchema } from '@codaco/protocol-validation';
import { NcNetworkSchema } from '@codaco/shared-consts';
import { PrismaClient } from '@prisma/client';
import { env } from '~/env';
import { StageMetadataSchema } from '~/lib/interviewer/ducks/modules/session';

const createPrismaClient = () =>
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  }).$extends({
    result: {
      interview: {
        network: {
          needs: {
            network: true,
          },
          compute: ({ network }) => {
            return NcNetworkSchema.parse(network);
          },
        },
        stageMetadata: {
          needs: {
            stageMetadata: true,
          },
          compute: ({ stageMetadata }) => {
            if (!stageMetadata) {
              return null;
            }
            return StageMetadataSchema.parse(stageMetadata);
          },
        },
      },
      protocol: {
        stages: {
          needs: {
            schemaVersion: true,
            stages: true,
          },
          compute: ({ schemaVersion, stages }) => {
            const protocolSchema = VersionedProtocolSchema.parse({
              schemaVersion,
              stages,
              codebook: {}, // dummy data
              experiments: null,
            });
            return protocolSchema.stages;
          },
        },
        codebook: {
          needs: {
            schemaVersion: true,
            codebook: true,
          },
          compute: ({ schemaVersion, codebook }) => {
            const protocolSchema = VersionedProtocolSchema.parse({
              schemaVersion,
              stages: [],
              codebook,
              experiments: null,
            });
            return protocolSchema.codebook;
          },
        },
        experiments: {
          needs: {
            schemaVersion: true,
            experiments: true,
          },
          compute: ({ schemaVersion, experiments }) => {
            const protocolSchema = VersionedProtocolSchema.parse({
              schemaVersion,
              stages: [],
              codebook: {},
              experiments,
            });

            if (!protocolSchema.experiments) return {};
            return protocolSchema.experiments;
          },
        },
      },
    },
  });

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
