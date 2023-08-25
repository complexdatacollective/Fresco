import { prisma } from '~/utils/db';
import { safeLoader } from '~/lib/data-mapper/safeLoader';
import { ProtocolValidation } from '~/lib/data-mapper/validation';

async function loadProtocols() {
  const protocols = await prisma.protocol.findMany();
  return protocols;
}

export const safeLoadProtocols = safeLoader({
  outputValidation: ProtocolValidation,
  loader: loadProtocols,
});
