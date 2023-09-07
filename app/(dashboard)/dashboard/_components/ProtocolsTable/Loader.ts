import { prisma } from '~/utils/db';
import { safeLoader } from '~/utils/safeLoader';
import { z } from 'zod';

const ProtocolValidation = z.array(
  z.object({
    id: z.string(),
    hash: z.string(),
    name: z.string(),
    schemaVersion: z.number(),
    description: z.string(),
    assetPath: z.string(),
    importedAt: z.date(),
    lastModified: z.date(),
    stages: z.string(),
  }),
);

export const safeLoadProtocols = safeLoader({
  outputValidation: ProtocolValidation,
  loader: () => prisma.protocol.findMany(),
});
