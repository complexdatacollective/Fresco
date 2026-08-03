import { Effect, Layer } from 'effect';
import { OutputError } from '@codaco/network-exporters/errors';
import { Output } from '@codaco/network-exporters/services/Output';
import { encodeExportEvent } from '~/lib/export/streamProtocol';

/**
 * An Output layer that streams each export file as base64 SSE events
 * (file-open → file-chunk* → file-close) through the shared writer, instead of
 * zipping. The browser reassembles the files and builds one zip. Does NOT close
 * the writer — the route owns the writer lifecycle (complete/error frames).
 */
export const makeFileStreamOutputLayer = (
  writer: WritableStreamDefaultWriter<Uint8Array>,
): Layer.Layer<Output> =>
  Layer.succeed(Output, {
    begin: () => Effect.succeed({}),
    writeEntry: (_handle, entry) =>
      Effect.tryPromise({
        try: async () => {
          await writer.write(
            encodeExportEvent({ type: 'file-open', name: entry.name }),
          );
          for await (const chunk of entry.data) {
            const b64 = Buffer.from(chunk).toString('base64');
            await writer.write(encodeExportEvent({ type: 'file-chunk', b64 }));
          }
          await writer.write(encodeExportEvent({ type: 'file-close' }));
        },
        catch: (cause) => new OutputError({ cause }),
      }),
    end: () => Effect.succeed({}),
  });
