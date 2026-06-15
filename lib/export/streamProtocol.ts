import { z } from 'zod/mini';
import { type ExportEvent } from '@codaco/network-exporters/events';

export type ExportStreamEvent =
  | ExportEvent
  | { type: 'data'; b64: string }
  | { type: 'complete' }
  | { type: 'error'; message: string };

const exportStreamEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('stage'),
    stage: z.enum(['fetching', 'formatting', 'generating', 'outputting']),
    message: z.string(),
  }),
  z.object({
    type: z.literal('progress'),
    stage: z.enum(['generating', 'outputting']),
    current: z.number(),
    total: z.number(),
  }),
  z.object({ type: z.literal('data'), b64: z.string() }),
  z.object({ type: z.literal('complete') }),
  z.object({ type: z.literal('error'), message: z.string() }),
]);

const encoder = new TextEncoder();

export function encodeExportEvent(event: ExportStreamEvent): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(event)}\n\n`);
}

export function parseExportEventBuffer(buffer: string): {
  events: ExportStreamEvent[];
  rest: string;
} {
  const parts = buffer.split('\n\n');
  const rest = parts.pop() ?? '';
  const events: ExportStreamEvent[] = [];
  for (const part of parts) {
    const line = part.split('\n').find((l) => l.startsWith('data: '));
    if (!line) continue;
    const parsed: unknown = JSON.parse(line.slice(6));
    const result = exportStreamEventSchema.safeParse(parsed);
    if (result.success) {
      events.push(result.data);
    }
  }
  return { events, rest };
}

export function decodeBase64Chunk(b64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

type ExportProgressEvent = Extract<
  ExportStreamEvent,
  { type: 'stage' | 'progress' }
>;

/**
 * Reads the export SSE stream to completion, forwarding progress events and
 * accumulating the base64 zip chunks.
 *
 * The `complete` event is the server's authoritative success signal (it is only
 * sent after the entire zip has been written). If the stream ends without it —
 * e.g. a serverless function killed by a timeout or memory limit mid-export —
 * the accumulated chunks are partial or empty, so we throw rather than hand back
 * a truncated/0-byte download that looks successful.
 */
export async function consumeExportStream(
  body: ReadableStream<Uint8Array>,
  onProgress: (event: ExportProgressEvent) => void,
): Promise<Uint8Array<ArrayBuffer>[]> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  const zipChunks: Uint8Array<ArrayBuffer>[] = [];
  let buffer = '';
  let streamError: string | null = null;
  let completed = false;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const { events, rest } = parseExportEventBuffer(buffer);
    buffer = rest;
    for (const event of events) {
      switch (event.type) {
        case 'stage':
        case 'progress':
          onProgress(event);
          break;
        case 'data':
          zipChunks.push(decodeBase64Chunk(event.b64));
          break;
        case 'error':
          streamError = event.message;
          break;
        case 'complete':
          completed = true;
          break;
      }
    }
  }

  if (streamError) throw new Error(streamError);
  if (!completed) {
    throw new Error(
      'The export was interrupted before it finished, so no file was downloaded. This can happen when exporting a very large number of interviews exceeds the server time limit — try exporting in smaller batches.',
    );
  }
  return zipChunks;
}
