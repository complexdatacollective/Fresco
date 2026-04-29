import type { Readable } from 'node:stream';
import { Context, type Effect } from 'effect';
import type { FileSystemError } from '~/lib/network-exporters/errors';

export class FileSystem extends Context.Tag('NetworkExporters/FileSystem')<
  FileSystem,
  {
    readonly readStream: (
      path: string,
    ) => Effect.Effect<Readable, FileSystemError>;
    readonly deleteFile: (path: string) => Effect.Effect<void, FileSystemError>;
  }
>() {}
