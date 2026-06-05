import {
  type CurrentProtocol,
  CurrentProtocolSchema,
} from '@codaco/protocol-validation';
import { NcNetworkSchema, StageMetadataSchema } from '@codaco/shared-consts';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from '~/env';
import { PrismaClient } from '~/lib/db/generated/client';
import { captureException } from '../posthog-server';

/**
 * Safely parse data with a Zod schema. On failure:
 * - Development: logs a warning and returns the fallback so the app stays usable
 * - Production: captures the exception to PostHog and throws, which is caught
 *   by the nearest error.tsx boundary rather than crashing the entire app
 */
function safeParseField<T>(
  schema: {
    safeParse: (data: unknown) => {
      success: boolean;
      data?: T;
      error?: unknown;
    };
  },
  data: unknown,
  fieldName: string,
  fallback: T,
): T {
  const result = schema.safeParse(data);

  if (result.success && result.data !== undefined) {
    return result.data;
  }

  const parseError = result.error;

  if (env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.warn(`[Prisma] Failed to parse "${fieldName}" field:`, parseError);
    return fallback;
  }

  void captureException(parseError, {
    context: `prisma.result.${fieldName}`,
  });

  throw new Error(
    `Failed to parse "${fieldName}" from database. This is likely a data integrity issue.`,
  );
}

const createPrismaClient = () => {
  const adapter = env.USE_NEON_POSTGRES_ADAPTER
    ? new PrismaNeon({ connectionString: env.DATABASE_URL })
    : new PrismaPg({ connectionString: env.DATABASE_URL });

  return new PrismaClient({
    adapter,
    log: env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  }).$extends({
    /**
     * These transformations use our Zod schemas to parse JSON from the DB
     * into known structures.
     *
     * Ultimately we will want to think about how to replace this. Some
     * considerations:
     *
     * - MongoDB or similar also stores unstructured data - could a similar
     *   approach help us to parse and validate that data?
     * - Zod has a Codec feature (https://zod.dev/codecs) that might be useful
     *   for two-way transformations. This might also help with passing data
     *   across client boundaries, where we currently need to use superjson.
     */
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
            const emptyNetwork = {
              nodes: [],
              edges: [],
              ego: { _uid: 'empty', attributes: {} },
            };

            if (!network) {
              return NcNetworkSchema.parse(emptyNetwork);
            }

            return safeParseField(
              NcNetworkSchema,
              network,
              'interview.network',
              NcNetworkSchema.parse(emptyNetwork),
            );
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
            return safeParseField(
              StageMetadataSchema,
              stageMetadata,
              'interview.stageMetadata',
              null,
            );
          },
        },
      },
      protocol: protocolJsonExtensions(),
    },
  });
};

/**
 * Returns the result-extension config that parses Protocol's JSON fields
 * (stages, codebook, experiments) into structured types using
 * CurrentProtocolSchema. Protocols are stored as schema-8.
 */
function protocolJsonExtensions() {
  const modelName = 'protocol';
  return {
    stages: {
      needs: {
        name: true,
        schemaVersion: true,
        stages: true,
        codebook: true,
      },
      compute: ({
        name,
        schemaVersion,
        stages,
        codebook,
      }: {
        name: string;
        schemaVersion: number;
        stages: unknown;
        codebook: unknown;
      }): CurrentProtocol['stages'] => {
        const parsed = safeParseField(
          CurrentProtocolSchema,
          { name, schemaVersion, stages, codebook, experiments: {} },
          `${modelName}.stages`,
          null,
        );
        return parsed?.stages ?? [];
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
      }: {
        name: string;
        schemaVersion: number;
        codebook: unknown;
      }): CurrentProtocol['codebook'] => {
        const parsed = safeParseField(
          CurrentProtocolSchema,
          { name, schemaVersion, stages: [], codebook, experiments: {} },
          `${modelName}.codebook`,
          null,
        );
        return parsed?.codebook ?? { edge: {}, node: {} };
      },
    },
    experiments: {
      needs: {
        name: true,
        schemaVersion: true,
        experiments: true,
      },
      compute: ({
        name,
        schemaVersion,
        experiments,
      }: {
        name: string;
        schemaVersion: number;
        experiments: unknown;
      }): CurrentProtocol['experiments'] => {
        if (!experiments) return {};
        const parsed = safeParseField(
          CurrentProtocolSchema,
          { name, schemaVersion, stages: [], codebook: {}, experiments },
          `${modelName}.experiments`,
          null,
        );
        return parsed?.experiments ?? {};
      },
    },
  };
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
