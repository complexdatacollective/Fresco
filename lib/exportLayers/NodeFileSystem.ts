import { createReadStream } from 'node:fs';
import { unlink } from 'node:fs/promises';
import { Effect, Layer } from 'effect';
import { FileSystemError } from '~/lib/network-exporters/errors';
import { FileSystem } from '~/lib/network-exporters/services/FileSystem';

export const NodeFileSystem = Layer.succeed(FileSystem, {
  readStream: (path) =>
    Effect.try({
      try: () => createReadStream(path),
      catch: (error) => new FileSystemError({ cause: error }),
    }),

  deleteFile: (path) =>
    Effect.tryPromise({
      try: () => unlink(path),
      catch: (error) => new FileSystemError({ cause: error }),
    }),
});
