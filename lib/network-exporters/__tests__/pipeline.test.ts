import { Effect, Layer, Queue } from 'effect';
import { describe, expect, it } from 'vitest';
import {
  DatabaseError,
  describeExportError,
} from '~/lib/network-exporters/errors';
import type { ExportEvent } from '~/lib/network-exporters/events';
import { NodeFileSystem } from '~/lib/exportLayers/NodeFileSystem';
import { exportPipeline } from '~/lib/network-exporters/pipeline';
import { FileStorage } from '~/lib/network-exporters/services/FileStorage';
import { InterviewRepository } from '~/lib/network-exporters/services/InterviewRepository';
import type { InterviewExportInput } from '~/lib/network-exporters/input';

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
          }),
        ),
    });

    const MockStorage = Layer.succeed(FileStorage, {
      upload: () => Effect.succeed({ key: 'k' }),
      getDownloadUrl: (key) => Effect.succeed(`http://test/download/${key}`),
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
            error: describeExportError(error, 'fetching interviews'),
          }),
        ),
      );
    }).pipe(Effect.provide(testLayer), Effect.runPromise);

    expect(result.status).toBe('error');
    expect(result.error).toMatch(
      /database connection failed.*fetching interviews/i,
    );
  });

  it('emits stage events to the queue', async () => {
    const MockRepo = Layer.succeed(InterviewRepository, {
      getForExport: () =>
        Effect.fail(
          new DatabaseError({
            cause: new Error('test'),
          }),
        ),
    });

    const MockStorage = Layer.succeed(FileStorage, {
      upload: () => Effect.succeed({ key: 'k' }),
      getDownloadUrl: (key) => Effect.succeed(`http://test/download/${key}`),
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

  it('emits all stage events in order on successful export', async () => {
    const mockInterview: InterviewExportInput = {
      id: 'test-interview-1',
      participantIdentifier: 'test-participant',
      startTime: new Date('2025-01-01'),
      finishTime: new Date('2025-01-01'),
      network: {
        nodes: [],
        edges: [],
        ego: { _uid: 'ego-1', attributes: {} },
      },
      protocol: {
        hash: 'testhash123',
        name: 'Test Protocol',
        codebook: { node: {}, edge: {} },
      },
    };

    const MockRepo = Layer.succeed(InterviewRepository, {
      getForExport: () => Effect.succeed([mockInterview]),
    });

    const MockStorage = Layer.succeed(FileStorage, {
      upload: () => Effect.succeed({ key: 'networkCanvasExport-123.zip' }),
      getDownloadUrl: (key) => Effect.succeed(`http://test/download/${key}`),
    });

    const testLayer = Layer.mergeAll(MockRepo, NodeFileSystem, MockStorage);

    const { result, events } = await Effect.gen(function* () {
      const queue = yield* Queue.unbounded<ExportEvent>();

      const pipelineResult = yield* exportPipeline(
        ['test-interview-1'],
        defaultExportOptions,
        queue,
      ).pipe(
        Effect.catchAll((error) =>
          Effect.succeed({
            status: 'error' as const,
            error: describeExportError(error),
          }),
        ),
      );

      const allEvents = yield* Queue.takeAll(queue);
      return { result: pipelineResult, events: [...allEvents] };
    }).pipe(Effect.provide(testLayer), Effect.runPromise);

    const stageEvents = events.filter((e) => e.type === 'stage');
    const stageOrder = stageEvents.map((e) => {
      if (e.type === 'stage') return e.stage;
      return '';
    });

    expect(stageOrder).toEqual([
      'fetching',
      'formatting',
      'generating',
      'archiving',
      'uploading',
    ]);

    expect(result.status).not.toBe('error');
  });
});
