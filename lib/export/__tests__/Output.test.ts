import { Cause, Effect } from 'effect';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { unzipSync } from 'fflate';
import { Output } from '@codaco/network-exporters/services/Output';
import { makeHttpOutputLayer } from '~/lib/export/Output';
import {
  decodeBase64Chunk,
  parseExportEventBuffer,
} from '~/lib/export/streamProtocol';

// Read the SSE stream, decode every `data` frame, and concatenate into the zip.
async function collectZipFromFrames(
  readable: ReadableStream<Uint8Array>,
): Promise<Uint8Array> {
  const reader = readable.getReader();
  const textDecoder = new TextDecoder();
  let buffer = '';
  const chunks: Uint8Array[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += textDecoder.decode(value, { stream: true });
    const { events, rest } = parseExportEventBuffer(buffer);
    buffer = rest;
    for (const event of events) {
      if (event.type === 'data') chunks.push(decodeBase64Chunk(event.b64));
    }
  }
  const total = chunks.reduce((sum, c) => sum + c.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

function chunksAsAsyncIterable(
  chunks: Uint8Array[],
): AsyncIterable<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk);
      controller.close();
    },
  });
}

function throwingAsyncIterable(
  initial: Uint8Array,
  error: Error,
): AsyncIterable<Uint8Array> {
  let yielded = false;
  return {
    [Symbol.asyncIterator]() {
      return {
        next(): Promise<IteratorResult<Uint8Array>> {
          if (!yielded) {
            yielded = true;
            return Promise.resolve({ done: false, value: initial });
          }
          return Promise.reject(error);
        },
        return(): Promise<IteratorResult<Uint8Array>> {
          return Promise.resolve({ done: true, value: new Uint8Array(0) });
        },
      };
    },
  };
}

describe('makeHttpOutputLayer', () => {
  it('streams a valid zip as base64 data frames', async () => {
    const { readable, writable } = new TransformStream<
      Uint8Array,
      Uint8Array
    >();
    const writer = writable.getWriter();
    const collected = collectZipFromFrames(readable);

    await Effect.gen(function* () {
      const output = yield* Output;
      const handle = yield* output.begin();
      yield* output.writeEntry(handle, {
        name: 'test.csv',
        data: chunksAsAsyncIterable([new TextEncoder().encode('a,b\n1,2\n')]),
      });
      yield* output.end(handle);
    }).pipe(Effect.provide(makeHttpOutputLayer(writer)), Effect.runPromise);

    // The route closes the writer in production; close here so the reader ends.
    await writer.close();

    const zip = unzipSync(await collected);
    expect(new TextDecoder().decode(zip['test.csv'])).toBe('a,b\n1,2\n');
  });

  it('rejects with OutputError when an entry stream throws', async () => {
    const { writable } = new TransformStream<Uint8Array, Uint8Array>();
    const writer = writable.getWriter();

    const exit = await Effect.gen(function* () {
      const output = yield* Output;
      const handle = yield* output.begin();
      yield* output.writeEntry(handle, {
        name: 'bad.csv',
        data: throwingAsyncIterable(
          new TextEncoder().encode('x'),
          new Error('entry stream boom'),
        ),
      });
      yield* output.end(handle);
    }).pipe(Effect.provide(makeHttpOutputLayer(writer)), Effect.runPromiseExit);

    expect(exit._tag).toBe('Failure');
    if (exit._tag !== 'Failure') return;
    const failure = Cause.failureOption(exit.cause);
    expect(failure._tag).toBe('Some');
    if (failure._tag !== 'Some') return;
    expect(failure.value._tag).toBe('NetworkExporters/OutputError');
  });
});
