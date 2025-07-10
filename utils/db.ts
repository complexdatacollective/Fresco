import {
  CodebookSchema,
  ProtocolSchema,
  stageSchema,
} from '@codaco/protocol-validation';
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
            stages: true,
          },
          compute: ({ stages }) => {
            return stageSchema.array().parse(stages);
          },
        },
        codebook: {
          needs: {
            codebook: true,
          },
          compute: ({ codebook }) => {
            return CodebookSchema.parse(codebook);
          },
        },
        experiments: {
          needs: {
            experiments: true,
          },
          compute: ({ experiments }) => {
            if (!experiments) {
              return null;
            }
            return ProtocolSchema.shape.experiments.parse(experiments);
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
