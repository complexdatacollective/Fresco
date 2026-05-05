import {
  isValidAssetType,
  type InterviewPayload,
  type ResolvedAsset,
} from '@codaco/interview';
import type { GetInterviewByIdQuery } from '~/queries/interviews';

export function mapInterviewPayload(
  source: NonNullable<GetInterviewByIdQuery>,
): {
  payload: InterviewPayload;
  assetUrls: Record<string, string>;
  initialStep: number;
} {
  const { protocol, ...session } = source;

  const assets: ResolvedAsset[] = protocol.assets.map((a) => {
    if (!isValidAssetType(a.type)) {
      throw new Error(`Unrecognised asset type from database: "${a.type}"`);
    }
    return {
      assetId: a.assetId,
      name: a.name,
      type: a.type,
      value: a.value ?? undefined,
    };
  });

  const assetUrls: Record<string, string> = {};
  for (const a of protocol.assets) {
    if (a.url) assetUrls[a.assetId] = a.url;
  }

  const payload: InterviewPayload = {
    session: {
      id: session.id,
      startTime: session.startTime.toISOString(),
      finishTime: session.finishTime?.toISOString() ?? null,
      exportTime: session.exportTime?.toISOString() ?? null,
      lastUpdated: session.lastUpdated.toISOString(),
      network: session.network,
      stageMetadata: session.stageMetadata ?? undefined,
    },
    protocol: {
      ...protocol,
      schemaVersion: 8,
      description: protocol.description ?? undefined,
      importedAt: protocol.importedAt.toISOString(),
      assets,
    },
  };

  return { payload, assetUrls, initialStep: session.currentStep };
}
