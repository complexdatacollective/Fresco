/*
  Types that cover the preview message exchange
  Lives here and in Architect (/architect-vite/src/utils/preview/types.ts).
  This must be kept in sync and updated in both places.
  TODO: Move to shared package when in the monorepo
*/

import { type VersionedProtocol } from '@codaco/protocol-validation';

// REQUEST TYPES
type AssetMetadata = {
  assetId: string;
  name: string;
  size: number;
};

type InitializePreviewRequest = {
  type: 'initialize-preview';
  protocol: VersionedProtocol;
  assetMeta: AssetMetadata[];
  architectVersion: string;
};

type CompletePreviewRequest = {
  type: 'complete-preview';
  protocolId: string;
};

type AbortPreviewRequest = {
  type: 'abort-preview';
  protocolId: string;
};

export type PreviewRequest =
  | InitializePreviewRequest
  | CompletePreviewRequest
  | AbortPreviewRequest;

// RESPONSE TYPES

type JobCreatedResponse = {
  status: 'job-created';
  protocolId: string;
  presignedUrls: string[];
};

// No assets to upload
export type ReadyResponse = {
  status: 'ready';
  previewUrl: string;
};

export type RejectedResponse = {
  status: 'rejected';
  message: 'Invalid protocol';
};

export type ErrorResponse = {
  status: 'error';
  message: string;
};

type RemovedResponse = {
  status: 'removed';
  protocolId: string;
};

export type InitializeResponse =
  | JobCreatedResponse
  | RejectedResponse
  | ErrorResponse
  | ReadyResponse;
export type CompleteResponse = ReadyResponse | ErrorResponse;
export type AbortResponse = RemovedResponse | ErrorResponse;

export type PreviewResponse =
  | InitializeResponse
  | CompleteResponse
  | AbortResponse;

export type AuthError = {
  response: ErrorResponse;
  status: number;
};
