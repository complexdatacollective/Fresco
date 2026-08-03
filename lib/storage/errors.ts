import { Data } from 'effect';

export class AssetStorageError extends Data.TaggedError('AssetStorageError')<{
  readonly cause: unknown;
  readonly userMessage: string;
}> {}
