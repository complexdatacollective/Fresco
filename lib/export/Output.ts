import { Effect, type Layer } from 'effect';
import { OutputError } from '@codaco/network-exporters/errors';
import { makeZipOutput } from '@codaco/network-exporters/layers/ZipOutput';
import type { Output } from '@codaco/network-exporters/services/Output';
import { encodeExportEvent } from '~/lib/export/streamProtocol';

type ZipSink = Parameters<typeof makeZipOutput>[0];

/**
 * Writes each zip chunk as a base64 `data` event through the shared writer.
 * Does NOT close the writer — the route owns the writer lifecycle so it can
 * append `complete`/`error` events after the zip finishes.
 */
export const makeHttpOutputLayer = (
  writer: WritableStreamDefaultWriter<Uint8Array>,
): Layer.Layer<Output> => {
  const sink: ZipSink = (zipStream) =>
    Effect.tryPromise({
      try: async () => {
        for await (const chunk of zipStream) {
          const b64 = Buffer.from(chunk).toString('base64');
          await writer.write(encodeExportEvent({ type: 'data', b64 }));
        }
        return {};
      },
      catch: (cause) => new OutputError({ cause }),
    });

  return makeZipOutput(sink);
};
