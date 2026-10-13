import {
  isValidAssetType,
  type InterviewPayload,
  type ResolvedAsset,
} from '@codaco/interview/contract';
import { COMPATIBLE_PROTOCOL_SCHEMA_VERSION } from '@codaco/interview/protocol-schema-version';
import { parseStoredInterviewSession } from '~/lib/db/storedInterviewSession';
import { parseStoredProtocol } from '~/lib/db/storedProtocol';
import type { GetInterviewByIdQuery } from '~/queries/interviews';

type MappedInterview =
  | {
      success: true;
      payload: InterviewPayload;
      assetUrls: Record<string, string>;
      initialStep: number;
      initialSyncRevision: number;
    }
  | {
      // Nothing may start the interview. Without the participant data the
      // client would build a network that its first sync writes over the
      // stored one; without the protocol it would run a design other than the
      // researcher's.
      success: false;
      unreadable: 'session' | 'protocol';
      error: unknown;
    };

export function mapInterviewPayload(
  source: NonNullable<GetInterviewByIdQuery>,
): MappedInterview {
  const { protocol, ...session } = source;

  // The stored version is written from the validated document at import
  // (actions/protocols.ts) and rewritten by the deploy-time migration
  // (scripts/migrate-protocols.ts), so every row that reaches an interview
  // should already match the runtime. Stamping a literal instead would
  // mislabel any row that does not, handing the interview a document it cannot
  // read while claiming it can; refuse loudly instead.
  const { schemaVersion } = protocol;
  if (schemaVersion !== COMPATIBLE_PROTOCOL_SCHEMA_VERSION) {
    throw new Error(
      `Protocol "${protocol.name}" (id=${protocol.id}) is stored as schema ` +
        `version ${schemaVersion}, but this version of Fresco runs protocol ` +
        `schema version ${COMPATIBLE_PROTOCOL_SCHEMA_VERSION}. It must be ` +
        `migrated before an interview using it can be started.`,
    );
  }

  const storedProtocol = parseStoredProtocol(protocol);
  if (!storedProtocol.success) {
    return {
      success: false,
      unreadable: 'protocol',
      error: storedProtocol.error,
    };
  }

  const stored = parseStoredInterviewSession(session);
  if (!stored.success) {
    return { success: false, unreadable: 'session', error: stored.error };
  }

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
      network: stored.data.network,
      stageMetadata: stored.data.stageMetadata ?? undefined,
    },
    protocol: {
      ...protocol,
      ...storedProtocol.data,
      schemaVersion,
      hash: protocol.hash,
      description: protocol.description ?? undefined,
      importedAt: protocol.importedAt.toISOString(),
      assets,
    },
  };

  return {
    success: true,
    payload,
    assetUrls,
    initialStep: session.currentStep,
    // The sync handler numbers its writes upwards from here. It is not part of
    // `InterviewPayload` because it belongs to this host's transport rather
    // than to the interview the engine runs.
    initialSyncRevision: session.syncRevision,
  };
}
