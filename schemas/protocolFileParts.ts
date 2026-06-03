import { z } from 'zod';

export const protocolFilePartSchema = z.object({
  key: z.string(),
  url: z.string(),
  size: z.number(),
});

export const protocolFilePartsSchema = z.array(protocolFilePartSchema);

export type ProtocolFilePart = z.infer<typeof protocolFilePartSchema>;
