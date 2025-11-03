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
            codebook: true,
          },
          compute: ({ schemaVersion, stages, codebook }) => {
            try {
              const protocolSchema = VersionedProtocolSchema.parse({
                schemaVersion,
                stages,
                codebook,
                experiments: {},
              });
              if (protocolSchema.experiments === null)
                protocolSchema.experiments = {};
              const parsedStages =
                VersionedProtocolSchema.safeParse(protocolSchema);
              if (!parsedStages.success) {
                console.error(
                  'VersionProtocolSchema parse failed:',
                  parsedStages.error,
                );
              }
              return parsedStages.data.stages;
            } catch (err) {
              console.error('stages.compute error:', err);
              return [];
            }
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
            try {
              const protocolSchema = VersionedProtocolSchema.parse({
                schemaVersion,
                stages: [],
                codebook,
                experiments: {},
              });
              if (protocolSchema.experiments === null)
                protocolSchema.experiments = {};
              const parsedCodebook =
                VersionedProtocolSchema.safeParse(protocolSchema);
              if (!parsedCodebook.success) {
                console.error('codebook parse error:', parsedCodebook.error);
              }
              return protocolSchema.codebook;
            } catch (err) {
              console.error('codebook.compute error:', err);
              return {};
            }
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
