import { Context, type Effect } from 'effect';
import type { WriteStream } from 'node:fs';
import type { FileSystemError } from '~/lib/export/errors';

export class FileSystem extends Context.Tag('FileSystem')<
  FileSystem,
  {
    readonly createWriteStream: (
      path: string,
    ) => Effect.Effect<WriteStream, FileSystemError>;
    readonly readFile: (path: string) => Effect.Effect<Buffer, FileSystemError>;
    readonly deleteFile: (path: string) => Effect.Effect<void, FileSystemError>;
    readonly getTempDir: () => Effect.Effect<string>;
  }
>() {}
