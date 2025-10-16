import { VersionedProtocolSchema } from '@codaco/protocol-validation';
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

export const protocolInsertSchema = z.looseObject({
  protocol: VersionedProtocolSchema,
  protocolName: z.string(),
  newAssets: z.array(assetInsertSchema),
  existingAssetIds: z.array(z.string()),
});
