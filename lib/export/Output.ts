import { Effect, type Layer } from 'effect';
import { OutputError } from '@codaco/network-exporters/errors';
import { makeZipOutput } from '@codaco/network-exporters/layers/ZipOutput';
import type { Output } from '@codaco/network-exporters/services/Output';

type ZipSink = Parameters<typeof makeZipOutput>[0];

export const makeHttpOutputLayer = (
  writable: WritableStream<Uint8Array>,
): Layer.Layer<Output> => {
  const sink: ZipSink = (zipStream) =>
    Effect.tryPromise({
      try: async () => {
        const writer = writable.getWriter();
        try {
          for await (const chunk of zipStream) {
            await writer.write(chunk);
          }
          await writer.close();
        } catch (error) {
          await writer.abort(error).catch(() => undefined);
          throw error;
        }
        return {};
      },
      catch: (cause) => new OutputError({ cause }),
    });

  return makeZipOutput(sink);
};
