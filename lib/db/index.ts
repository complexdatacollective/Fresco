import {
  CurrentProtocolSchema,
  type VersionedProtocol,
  VersionedProtocolSchema,
} from '@codaco/protocol-validation';
import { NcNetworkSchema } from '@codaco/shared-consts';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '~/lib/db/generated/client';
import { env } from '~/env';
import { StageMetadataSchema } from '~/lib/interviewer/ducks/modules/session';

const createPrismaClient = () => {
  const adapter = env.USE_NEON_POSTGRES_ADAPTER
    ? new PrismaNeon({ connectionString: env.DATABASE_URL })
    : new PrismaPg({ connectionString: env.DATABASE_URL });

  return new PrismaClient({
    adapter,
    log: env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  }).$extends({
    query: {
      appSettings: {
        async findUnique({ args, query }) {
          // Only intercept queries with a key
          if (!args.where?.key) {
            return query(args);
          }

          const key = args.where.key;
          const result = await query(args);

          // Return the raw value or null if no result
          // The query layer will handle parsing to proper types
          return {
            key,
            value: result?.value ?? null,
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
            name: true,
            schemaVersion: true,
            stages: true,
            codebook: true,
          },
          compute: ({ name, schemaVersion, stages, codebook }) => {
            const protocolSchema = VersionedProtocolSchema.parse({
              name,
              schemaVersion,
              stages,
              codebook,
              experiments: {},
            });
            return protocolSchema.stages;
          },
        },
        codebook: {
          needs: {
            name: true,
            schemaVersion: true,
            codebook: true,
          },
          compute: ({
            name,
            schemaVersion,
            codebook,
          }): VersionedProtocol['codebook'] => {
            const protocolSchema = VersionedProtocolSchema.parse({
              name,
              schemaVersion,
              stages: [],
              codebook,
              experiments: {},
            });
            return protocolSchema.codebook;
          },
        },
        experiments: {
          needs: {
            name: true,
            schemaVersion: true,
            experiments: true,
          },
          compute: ({ name, schemaVersion, experiments }) => {
            if (schemaVersion < 8 || !experiments) {
              return {};
            }

            const protocolSchema = CurrentProtocolSchema.parse({
              name,
              schemaVersion,
              stages: [],
              codebook: {},
              experiments,
            });
            return protocolSchema.experiments ?? {};
          },
        },
      },
    },
  });
};

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
