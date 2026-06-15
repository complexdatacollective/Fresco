import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';
import { Output } from '@codaco/network-exporters/services/Output';
import { makeFileStreamOutputLayer } from '~/lib/export/FileStreamOutput';
import { parseExportEventBuffer } from '~/lib/export/streamProtocol';

function asyncIterableOf(chunks: Uint8Array[]): AsyncIterable<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk);
      controller.close();
    },
  });
}

async function readAllEvents(readable: ReadableStream<Uint8Array>) {
  const reader = readable.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
  }
  return parseExportEventBuffer(buffer).events;
}

describe('makeFileStreamOutputLayer', () => {
  it('emits file-open, file-chunk(s) and file-close for an entry', async () => {
    const { readable, writable } = new TransformStream<
      Uint8Array,
      Uint8Array
    >();
    const writer = writable.getWriter();
    const layer = makeFileStreamOutputLayer(writer);

    const program = Effect.gen(function* () {
      const out = yield* Output;
      const handle = yield* out.begin();
      yield* out.writeEntry(handle, {
        name: 'graph.graphml',
        data: asyncIterableOf([new Uint8Array([1, 2]), new Uint8Array([3])]),
      });
      yield* out.end(handle);
    });

    // Start reading before writing to avoid TransformStream backpressure deadlock.
    const eventsPromise = readAllEvents(readable);
    await Effect.runPromise(program.pipe(Effect.provide(layer)));
    await writer.close();

    const events = await eventsPromise;
    expect(events).toEqual([
      { type: 'file-open', name: 'graph.graphml' },
      { type: 'file-chunk', b64: Buffer.from([1, 2]).toString('base64') },
      { type: 'file-chunk', b64: Buffer.from([3]).toString('base64') },
      { type: 'file-close' },
    ]);
  });
});
