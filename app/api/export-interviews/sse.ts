import type { ExportEvent } from '~/lib/network-exporters/events';

export type ExportCompleteEvent = {
  type: 'complete';
  zipUrl: string;
  zipKey: string;
};

export type ExportErrorEvent = {
  type: 'error';
  message: string;
};

export type ExportSseEvent =
  | ExportEvent
  | ExportCompleteEvent
  | ExportErrorEvent;

export function formatSSE(event: ExportSseEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}
