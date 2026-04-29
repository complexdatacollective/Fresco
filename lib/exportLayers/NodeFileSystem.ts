import { Effect, Layer } from 'effect';
import { readFile as nodeReadFile, unlink } from 'node:fs/promises';
import { FileSystemError } from '~/lib/network-exporters/errors';
import { FileSystem } from '~/lib/network-exporters/services/FileSystem';

export const NodeFileSystem = Layer.succeed(FileSystem, {
  readFile: (path) =>
    Effect.tryPromise({
      try: () => nodeReadFile(path),
      catch: (error) => new FileSystemError({ cause: error }),
    }),

  deleteFile: (path) =>
    Effect.tryPromise({
      try: () => unlink(path),
      catch: (error) => new FileSystemError({ cause: error }),
    }),
});
