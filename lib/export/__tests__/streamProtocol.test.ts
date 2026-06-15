import { describe, expect, it } from 'vitest';
import {
  consumeBatchStream,
  decodeBase64Chunk,
  encodeExportEvent,
  type ExportStreamEvent,
  parseExportEventBuffer,
} from '~/lib/export/streamProtocol';

const decoder = new TextDecoder();

function streamOf(events: ExportStreamEvent[]): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      for (const event of events) controller.enqueue(encodeExportEvent(event));
      controller.close();
    },
  });
}

const b64 = (bytes: number[]) => Buffer.from(bytes).toString('base64');

describe('encodeExportEvent', () => {
  it('encodes an event as a single SSE data frame', () => {
    const bytes = encodeExportEvent({
      type: 'progress',
      stage: 'generating',
      current: 5,
      total: 10,
    });
    expect(decoder.decode(bytes)).toBe(
      'data: {"type":"progress","stage":"generating","current":5,"total":10}\n\n',
    );
  });
});

describe('parseExportEventBuffer', () => {
  it('parses whole frames and returns the trailing partial', () => {
    const buffer =
      'data: {"type":"stage","stage":"generating","message":"x"}\n\n' +
      'data: {"type":"file-open","name":"a.csv"}\n\n' +
      'data: {"type":"progr';
    const { events, rest } = parseExportEventBuffer(buffer);
    expect(events).toEqual([
      { type: 'stage', stage: 'generating', message: 'x' },
      { type: 'file-open', name: 'a.csv' },
    ]);
    expect(rest).toBe('data: {"type":"progr');
  });

  it('returns no events for an empty buffer', () => {
    expect(parseExportEventBuffer('')).toEqual({ events: [], rest: '' });
  });
});

describe('decodeBase64Chunk', () => {
  it('round-trips bytes encoded by encodeExportEvent data frames', () => {
    const original = new Uint8Array([0, 1, 2, 253, 254, 255]);
    expect(
      Array.from(decodeBase64Chunk(b64([0, 1, 2, 253, 254, 255]))),
    ).toEqual(Array.from(original));
  });
});

describe('consumeBatchStream', () => {
  it('reassembles file entries and returns them with no failures', async () => {
    const result = await consumeBatchStream(
      streamOf([
        { type: 'file-open', name: 'a.csv' },
        { type: 'file-chunk', b64: b64([1, 2]) },
        { type: 'file-chunk', b64: b64([3]) },
        { type: 'file-close' },
        { type: 'complete', failedSessionIds: [] },
      ]),
      () => undefined,
    );
    expect([...result.files.keys()]).toEqual(['a.csv']);
    expect(Array.from(result.files.get('a.csv')!)).toEqual([1, 2, 3]);
    expect(result.failedSessionIds).toEqual([]);
  });

  it('returns failedSessionIds from the complete event', async () => {
    const result = await consumeBatchStream(
      streamOf([{ type: 'complete', failedSessionIds: ['s1', 's2'] }]),
      () => undefined,
    );
    expect(result.failedSessionIds).toEqual(['s1', 's2']);
  });

  it('reports progress events', async () => {
    const progress: ExportStreamEvent[] = [];
    await consumeBatchStream(
      streamOf([
        { type: 'progress', stage: 'generating', current: 1, total: 2 },
        { type: 'complete', failedSessionIds: [] },
      ]),
      (event) => progress.push(event),
    );
    expect(progress).toEqual([
      { type: 'progress', stage: 'generating', current: 1, total: 2 },
    ]);
  });

  it('throws when the stream ends without a complete event', async () => {
    await expect(
      consumeBatchStream(
        streamOf([
          { type: 'file-open', name: 'a.csv' },
          { type: 'file-chunk', b64: b64([1]) },
          { type: 'file-close' },
        ]),
        () => undefined,
      ),
    ).rejects.toThrow(/interrupted/i);
  });

  it('throws the server message on an error event', async () => {
    await expect(
      consumeBatchStream(
        streamOf([{ type: 'error', message: 'boom' }]),
        () => undefined,
      ),
    ).rejects.toThrow('boom');
  });

  it('throws on a file-chunk with no open file', async () => {
    await expect(
      consumeBatchStream(
        streamOf([{ type: 'file-chunk', b64: b64([1]) }]),
        () => undefined,
      ),
    ).rejects.toThrow(/file-open/);
  });
});
