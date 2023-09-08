/* eslint-disable local-rules/require-data-mapper */
import type { SetupMetadata } from "@prisma/client";
import { prisma } from "~/utils/db";

export default async function getSetupMetadata(): Promise<SetupMetadata> {

  let setupMetadata = await prisma.setupMetadata.findFirst();

  // if no setup metadata exists, seed it
  if (!setupMetadata) {
    setupMetadata = await prisma.setupMetadata.create({
      data: {
        id: 1,
        configured: false,
        initializedAt: new Date(),
      },
    });
  }

  return setupMetadata;
}
