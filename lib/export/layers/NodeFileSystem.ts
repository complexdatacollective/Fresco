import { Effect, Layer } from 'effect';
import { readFile as nodeReadFile, unlink } from 'node:fs/promises';
import { FileSystemError, getUserMessage } from '~/lib/export/errors';
import { FileSystem } from '~/lib/export/services/FileSystem';

export const NodeFileSystem = Layer.succeed(FileSystem, {
  readFile: (path) =>
    Effect.tryPromise({
      try: () => nodeReadFile(path),
      catch: (error) =>
        new FileSystemError({
          cause: error,
          userMessage: getUserMessage(error, 'reading export files'),
        }),
    }),

  deleteFile: (path) =>
    Effect.tryPromise({
      try: () => unlink(path),
      catch: (error) =>
        new FileSystemError({
          cause: error,
          userMessage: getUserMessage(error, 'cleaning up temporary files'),
        }),
    }),
});
