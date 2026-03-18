import { Effect, Layer } from 'effect';
import { describe, expect, it } from 'vitest';
import { DatabaseError } from '~/lib/export/errors';
import { NodeFileSystem } from '~/lib/export/layers/NodeFileSystem';
import { exportPipeline } from '~/lib/export/pipeline';
import { FileStorage } from '~/lib/export/services/FileStorage';
import { InterviewRepository } from '~/lib/export/services/InterviewRepository';

const defaultExportOptions = {
  exportGraphML: true,
  exportCSV: false,
  globalOptions: {
    useScreenLayoutCoordinates: true,
    screenLayoutHeight: 1080,
    screenLayoutWidth: 1920,
  },
};

describe('exportPipeline', () => {
  it('returns error when database fetch fails', async () => {
    const MockRepo = Layer.succeed(InterviewRepository, {
      getForExport: () =>
        Effect.fail(
          new DatabaseError({
            cause: new Error('connection refused'),
            userMessage: 'Database connection failed.',
          }),
        ),
    });

    const MockStorage = Layer.succeed(FileStorage, {
      upload: () => Effect.succeed({ url: 'http://test/file.zip', key: 'k' }),
      delete: () => Effect.void,
    });

    const testLayer = Layer.mergeAll(MockRepo, NodeFileSystem, MockStorage);

    const result = await exportPipeline(['test-id'], defaultExportOptions).pipe(
      Effect.catchAll((error) =>
        Effect.succeed({
          status: 'error' as const,
          error: error.userMessage,
        }),
      ),
      Effect.provide(testLayer),
      Effect.runPromise,
    );

    expect(result.status).toBe('error');
    expect(result.error).toBe('Database connection failed.');
  });
});
