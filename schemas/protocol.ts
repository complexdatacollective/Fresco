import { z } from 'zod';

const assetInsertSchema = z.array(
  z.object({
    key: z.string(),
    assetId: z.string(),
    name: z.string(),
    type: z.string(),
    url: z.string(),
    size: z.number(),
  }),
);

export type AssetInsertType = z.infer<typeof assetInsertSchema>;

export const protocolInsertSchema = z
  .object({
    protocol: z.unknown(), // TODO: replace this with zod schema version of Protocol type
    protocolName: z.string(),
    newAssets: assetInsertSchema,
    existingAssetIds: z.array(z.string()),
  })
  .passthrough();
