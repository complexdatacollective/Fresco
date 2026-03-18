import { Effect, Layer, Queue } from 'effect';
import { describe, expect, it } from 'vitest';
import { DatabaseError } from '~/lib/export/errors';
import type { ExportEvent } from '~/lib/export/exportEvents';
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

    const result = await Effect.gen(function* () {
      const queue = yield* Queue.unbounded<ExportEvent>();
      return yield* exportPipeline(
        ['test-id'],
        defaultExportOptions,
        queue,
      ).pipe(
        Effect.catchAll((error) =>
          Effect.succeed({
            status: 'error' as const,
            error: error.userMessage,
          }),
        ),
      );
    }).pipe(Effect.provide(testLayer), Effect.runPromise);

    expect(result.status).toBe('error');
    expect(result.error).toBe('Database connection failed.');
  });

  it('emits stage events to the queue', async () => {
    const MockRepo = Layer.succeed(InterviewRepository, {
      getForExport: () =>
        Effect.fail(
          new DatabaseError({
            cause: new Error('test'),
            userMessage: 'Test error.',
          }),
        ),
    });

    const MockStorage = Layer.succeed(FileStorage, {
      upload: () => Effect.succeed({ url: 'http://test/file.zip', key: 'k' }),
      delete: () => Effect.void,
    });

    const testLayer = Layer.mergeAll(MockRepo, NodeFileSystem, MockStorage);

    const events = await Effect.gen(function* () {
      const queue = yield* Queue.unbounded<ExportEvent>();

      yield* exportPipeline(['test-id'], defaultExportOptions, queue).pipe(
        Effect.catchAll(() => Effect.void),
      );

      return yield* Queue.takeAll(queue);
    }).pipe(Effect.provide(testLayer), Effect.runPromise);

    const stageEvents = [...events].filter((e) => e.type === 'stage');
    expect(stageEvents.length).toBeGreaterThanOrEqual(1);
    expect(stageEvents[0]?.stage).toBe('fetching');
  });
});
