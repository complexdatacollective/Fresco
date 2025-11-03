import {
  CurrentProtocolSchema,
  type VersionedProtocol,
  VersionedProtocolSchema,
} from '@codaco/protocol-validation';
import { NcNetworkSchema } from '@codaco/shared-consts';
import { PrismaClient } from '@prisma/client';
import { env } from '~/env';
import { StageMetadataSchema } from '~/lib/interviewer/ducks/modules/session';
import { appSettingPreprocessedSchema } from '~/schemas/appSettings';

const createPrismaClient = () =>
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  }).$extends({
    query: {
      appSettings: {
        async findUnique({ args, query }) {
          // Only intercept queries with a key
          if (!args.where?.key) {
            return query(args);
          }

          const key = args.where.key as string;

          if (!(key in appSettingPreprocessedSchema.shape)) {
            throw new Error(`No preprocessed schema for key: ${key}`);
          }

          const result = await query(args);

          // Parse the value (or undefined if no result) to get coerced value with defaults
          const parsedValue = appSettingPreprocessedSchema.shape[
            key as keyof typeof appSettingPreprocessedSchema.shape
          ].parse(result?.value);

          return {
            key,
            value: parsedValue,
          };
        },
      },
    },
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
          compute: ({
            schemaVersion,
            codebook,
          }): VersionedProtocol['codebook'] => {
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
            if (schemaVersion < 8 || !experiments) {
              return null;
            }

            const protocolSchema = CurrentProtocolSchema.parse({
              schemaVersion,
              stages: [],
              codebook: {},
              experiments,
            });
            return protocolSchema.experiments ?? null;
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
