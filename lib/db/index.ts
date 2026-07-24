import {
  CodebookSchema,
  type CurrentProtocol,
  ExperimentsSchema,
  stageSchema,
} from '@codaco/protocol-validation';
import { NcNetworkSchema, StageMetadataSchema } from '@codaco/shared-consts';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from '~/env';
import { PrismaClient } from '~/lib/db/generated/client';
import { safeParseField } from '~/lib/db/safeParseField';

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

const StagesSchema = stageSchema.array();

/**
 * Result-extension config that structurally parses Protocol's JSON fields
 * (stages, codebook, experiments) into typed values.
 *
 * Each field is validated against its own schema rather than the whole-protocol
 * CurrentProtocolSchema. That whole-protocol schema cross-references the
 * `assetManifest` (to check roster/geospatial asset references), but Fresco
 * stores assets in a separate table and a Prisma result extension cannot reach
 * that relation — so the manifest is never available here. Cross-reference
 * validation already runs at import time (validateAndMigrateProtocol); at read
 * time we only need structural typing, which these per-field schemas provide
 * without requiring the manifest.
 *
 * safeParseField returns the fallback on failure rather than throwing, so a
 * single malformed field never crashes a page.
 */
function protocolJsonExtensions() {
  const modelName = 'protocol';
  return {
    stages: {
      needs: {
        stages: true,
      },
      compute: ({ stages }: { stages: unknown }): CurrentProtocol['stages'] =>
        safeParseField(StagesSchema, stages, `${modelName}.stages`, []),
    },
    codebook: {
      needs: {
        codebook: true,
      },
      compute: ({
        codebook,
      }: {
        codebook: unknown;
      }): CurrentProtocol['codebook'] =>
        safeParseField(CodebookSchema, codebook, `${modelName}.codebook`, {
          edge: {},
          node: {},
        }),
    },
    experiments: {
      needs: {
        experiments: true,
      },
      compute: ({
        experiments,
      }: {
        experiments: unknown;
      }): CurrentProtocol['experiments'] => {
        if (!experiments) return {};
        return safeParseField(
          ExperimentsSchema,
          experiments,
          `${modelName}.experiments`,
          {},
        );
      },
    },
  };
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
