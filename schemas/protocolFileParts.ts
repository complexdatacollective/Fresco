import { z } from 'zod';

export const protocolFilePartsSchema = z.array(
  z.object({
    key: z.string(),
    url: z.string(),
    size: z.number(),
  }),
);
