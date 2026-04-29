import { type CurrentProtocol } from '@codaco/protocol-validation';
import { type SessionState } from '~/lib/interviewer/ducks/modules/session';

/**
 * Package-internal asset representation. Has only the fields the interviewer
 * needs at runtime (ID, display name, type, and optionally an inline value
 * for apikey-style assets). URLs are resolved lazily via AssetRequestHandler.
 */
export type ResolvedAsset = {
  assetId: string;
  name: string;
  type: 'image' | 'video' | 'audio' | 'network' | 'geojson' | 'apikey';
  value?: string; // populated for apikey assets only
};

/**
 * Protocol payload: the validated protocol plus per-interview metadata
 * (id, importedAt) the package carries in its store. Always schema 8 —
 * older protocols are migrated to the current version at import time, so
 * downstream code never sees a versioned union.
 */
export type ProtocolPayload = Omit<CurrentProtocol, 'assetManifest'> & {
  id: string;
  importedAt: string; // ISO
  assets: ResolvedAsset[];
};

/**
 * Session payload. Matches the shape of SessionState (already used by the
 * reducer) — re-exported from a stable public name.
 */
export type SessionPayload = SessionState;

export type InterviewPayload = {
  session: SessionPayload;
  protocol: ProtocolPayload;
};

export type SyncHandler = (
  interviewId: string,
  session: SessionPayload,
) => Promise<void>;

export type FinishHandler = (
  interviewId: string,
  signal: AbortSignal,
) => Promise<void>;

export type AssetRequestHandler = (assetId: string) => Promise<string>;

export type InterviewerFlags = {
  isE2E?: boolean;
  isDevelopment?: boolean;
};
