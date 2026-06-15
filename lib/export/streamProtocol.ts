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
