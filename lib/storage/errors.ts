import { Data } from 'effect';

export { FileStorageError, getUserMessage } from '~/lib/network-exporters/errors';

export class AssetStorageError extends Data.TaggedError('AssetStorageError')<{
  readonly cause: unknown;
  readonly userMessage: string;
}> {}
