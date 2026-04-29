import { Effect, Layer, Queue } from 'effect';
import { describe, expect, it, vi } from 'vitest';
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
import type * as GetFormatterModule from '~/lib/network-exporters/utils/getFormatter';

// Force the attributeList formatter to throw so the partial-success test
// produces exactly one ExportFailure alongside successes from the other
// formats. Other tests in this file disable CSV export, so they are not
// affected by this mock.
vi.mock('~/lib/network-exporters/utils/getFormatter', async (importOriginal) => {
  const original = await importOriginal<typeof GetFormatterModule>();
  return {
    ...original,
    getFormatter: (format: Parameters<typeof original.getFormatter>[0]) => {
      if (format === 'attributeList') {
        return () => {
          throw new Error('mock formatter failure');
        };
      }
      return original.getFormatter(format);
    },
  };
});

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
    if (result.status !== 'error') throw new Error('Expected error status');
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

  it('returns status=partial when one file generation fails', async () => {
    const mockInterview: InterviewExportInput = {
      id: 'test-interview-2',
      participantIdentifier: 'test-participant',
      startTime: new Date('2025-01-01'),
      finishTime: new Date('2025-01-01'),
      network: {
        nodes: [],
        edges: [],
        ego: { _uid: 'ego-2', attributes: {} },
      },
      protocol: {
        hash: 'testhash456',
        name: 'Test Protocol',
        codebook: { node: {}, edge: {} },
      },
    };

    const MockRepo = Layer.succeed(InterviewRepository, {
      getForExport: () => Effect.succeed([mockInterview]),
    });

    const MockStorage = Layer.succeed(FileStorage, {
      upload: () => Effect.succeed({ key: 'networkCanvasExport-456.zip' }),
      getDownloadUrl: (key) => Effect.succeed(`http://test/download/${key}`),
    });

    const testLayer = Layer.mergeAll(MockRepo, NodeFileSystem, MockStorage);

    // Enable both formats so graphml + edgeList + ego succeed and only
    // attributeList (mocked above to throw) fails.
    const exportOptions = { ...defaultExportOptions, exportCSV: true };

    const result = await Effect.gen(function* () {
      const queue = yield* Queue.unbounded<ExportEvent>();
      return yield* exportPipeline(
        ['test-interview-2'],
        exportOptions,
        queue,
      );
    }).pipe(Effect.provide(testLayer), Effect.runPromise);

    expect(result.status).toBe('partial');
    expect(result.zipUrl).toBe(
      'http://test/download/networkCanvasExport-456.zip',
    );
    expect(result.zipKey).toBe('networkCanvasExport-456.zip');
    expect(result.failedExports).toHaveLength(1);
    expect(result.failedExports[0]?.format).toBe('attributeList');
    expect(result.failedExports[0]?.sessionId).toBe('test-interview-2');
    expect(result.successfulExports.length).toBeGreaterThan(0);
    expect(
      result.successfulExports.every((r) => r.format !== 'attributeList'),
    ).toBe(true);
  });
});
