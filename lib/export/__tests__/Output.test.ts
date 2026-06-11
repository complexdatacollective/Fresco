import { Cause, Effect } from 'effect';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { unzipSync } from 'fflate';
import { Output } from '@codaco/network-exporters/services/Output';
import { makeHttpOutputLayer } from '~/lib/export/Output';

async function collect(
  readable: ReadableStream<Uint8Array>,
): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  const reader = readable.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
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
      for (const chunk of chunks) {
        controller.enqueue(chunk);
      }
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
  it('streams a valid zip through the writable stream', async () => {
    const { readable, writable } = new TransformStream<
      Uint8Array,
      Uint8Array
    >();
    const collected = collect(readable);

    await Effect.gen(function* () {
      const output = yield* Output;
      const handle = yield* output.begin();
      yield* output.writeEntry(handle, {
        name: 'test.csv',
        data: chunksAsAsyncIterable([new TextEncoder().encode('a,b\n1,2\n')]),
      });
      yield* output.end(handle);
    }).pipe(Effect.provide(makeHttpOutputLayer(writable)), Effect.runPromise);

    const zip = unzipSync(await collected);
    expect(new TextDecoder().decode(zip['test.csv'])).toBe('a,b\n1,2\n');
  });

  it('aborts the writable and rejects when an entry stream throws', async () => {
    const { readable, writable } = new TransformStream<
      Uint8Array,
      Uint8Array
    >();

    // Drain the readable in the background like a real HTTP response consumer
    // would. Aborting the writable side errors the readable, so the drain must
    // observe a rejection. Capture the outcome instead of letting the promise
    // reject unhandled while the Effect is still running.
    const drainOutcome = collect(readable).then(
      () => ({ rejected: false as const }),
      (error: unknown) => ({ rejected: true as const, error }),
    );

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
    }).pipe(
      Effect.provide(makeHttpOutputLayer(writable)),
      Effect.runPromiseExit,
    );

    expect(exit._tag).toBe('Failure');
    if (exit._tag !== 'Failure') return;
    const failure = Cause.failureOption(exit.cause);
    expect(failure._tag).toBe('Some');
    if (failure._tag !== 'Some') return;
    expect(failure.value._tag).toBe('NetworkExporters/OutputError');

    const drained = await drainOutcome;
    expect(drained.rejected).toBe(true);
    if (!drained.rejected) return;
    expect(drained.error).toEqual(new Error('entry stream boom'));
  });
});
