import { Context, type Effect } from 'effect';
import type { FileSystemError } from '~/lib/network-exporters/errors';

export class FileSystem extends Context.Tag('FileSystem')<
  FileSystem,
  {
    readonly readFile: (path: string) => Effect.Effect<Buffer, FileSystemError>;
    readonly deleteFile: (path: string) => Effect.Effect<void, FileSystemError>;
  }
>() {}
