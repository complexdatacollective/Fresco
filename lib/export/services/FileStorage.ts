import { Context, type Effect } from 'effect';
import type { FileStorageError } from '~/lib/export/errors';

export class FileStorage extends Context.Tag('FileStorage')<
  FileStorage,
  {
    readonly upload: (
      fileBuffer: Buffer,
      fileName: string,
    ) => Effect.Effect<{ url: string; key: string }, FileStorageError>;
    readonly delete: (key: string) => Effect.Effect<void, FileStorageError>;
  }
>() {}
