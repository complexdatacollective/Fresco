import type { Readable } from 'node:stream';
import { Context, type Effect } from 'effect';
import type { FileStorageError } from '~/lib/network-exporters/errors';

export class FileStorage extends Context.Tag('NetworkExporters/FileStorage')<
  FileStorage,
  {
    readonly upload: (
      stream: Readable,
      fileName: string,
    ) => Effect.Effect<{ key: string }, FileStorageError>;
    readonly getDownloadUrl: (
      key: string,
    ) => Effect.Effect<string, FileStorageError>;
  }
>() {}
