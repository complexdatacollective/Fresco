import { z } from 'zod/mini';
import { type ExportEvent } from '@codaco/network-exporters/events';

export type ExportStreamEvent =
  | ExportEvent
  | { type: 'file-open'; name: string }
  | { type: 'file-chunk'; b64: string }
  | { type: 'file-close' }
  | { type: 'complete'; failedSessionIds?: string[] }
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
  z.object({ type: z.literal('file-open'), name: z.string() }),
  z.object({ type: z.literal('file-chunk'), b64: z.string() }),
  z.object({ type: z.literal('file-close') }),
  z.object({
    type: z.literal('complete'),
    failedSessionIds: z.optional(z.array(z.string())),
  }),
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

function concatChunks(
  chunks: Uint8Array<ArrayBuffer>[],
): Uint8Array<ArrayBuffer> {
  const total = chunks.reduce((n, chunk) => n + chunk.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

/**
 * Reads one export batch's SSE stream: forwards progress, reassembles file
 * entries (file-open → file-chunk* → file-close), and requires the server's
 * `complete` event. A stream that ends without `complete` (e.g. a serverless
 * function killed mid-batch) throws, so the orchestrator retries it instead of
 * treating a truncated batch as success.
 */
export async function consumeBatchStream(
  body: ReadableStream<Uint8Array>,
  onProgress: (event: ExportProgressEvent) => void,
): Promise<{
  files: Map<string, Uint8Array<ArrayBuffer>>;
  failedSessionIds: string[];
}> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  const files = new Map<string, Uint8Array<ArrayBuffer>>();
  let buffer = '';
  let streamError: string | null = null;
  let completed = false;
  let failedSessionIds: string[] = [];
  let openName: string | null = null;
  let openChunks: Uint8Array<ArrayBuffer>[] = [];

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
        case 'file-open':
          openName = event.name;
          openChunks = [];
          break;
        case 'file-chunk':
          if (openName === null) {
            throw new Error('Received file-chunk before file-open');
          }
          openChunks.push(decodeBase64Chunk(event.b64));
          break;
        case 'file-close':
          if (openName === null) {
            throw new Error('Received file-close before file-open');
          }
          files.set(openName, concatChunks(openChunks));
          openName = null;
          openChunks = [];
          break;
        case 'error':
          streamError = event.message;
          break;
        case 'complete':
          completed = true;
          failedSessionIds = event.failedSessionIds ?? [];
          break;
      }
    }
  }

  if (streamError) throw new Error(streamError);
  if (!completed) {
    throw new Error('The export batch was interrupted before it finished.');
  }
  return { files, failedSessionIds };
}
