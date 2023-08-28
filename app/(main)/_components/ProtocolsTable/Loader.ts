import { prisma } from '~/utils/db';
import { safeLoader } from '~/lib/data-mapper/safeLoader';
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
    ownerId: z.string(),
  }),
);

async function loadProtocols() {
  const protocols = await prisma.protocol.findMany();
  return protocols;
}

export const safeLoadProtocols = safeLoader({
  outputValidation: ProtocolValidation,
  loader: loadProtocols,
  isArray: true,
});
