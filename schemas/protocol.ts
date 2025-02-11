import { z } from 'zod';

const assetInsertSchema = z.object({
  key: z.string(),
  assetId: z.string(),
  name: z.string(),
  type: z.string(),
  url: z.string(),
  size: z.number(),
  value: z.string().optional(),
});

export type AssetInsertType = z.infer<typeof assetInsertSchema>;

export const protocolInsertSchema = z
  .object({
    protocol: z.unknown(), // TODO: replace this with zod schema version of Protocol type
    protocolName: z.string(),
    newAssets: z.array(assetInsertSchema),
    existingAssetIds: z.array(z.string()),
  })
  .passthrough();
