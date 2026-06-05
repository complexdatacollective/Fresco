import type { ExportEvent } from '@codaco/network-exporters/events';

type ExportCompleteEvent = {
  type: 'complete';
  zipUrl: string;
  zipKey: string;
};

type ExportErrorEvent = {
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
