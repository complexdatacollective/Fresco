type ExportStage =
  | 'fetching'
  | 'formatting'
  | 'generating'
  | 'archiving'
  | 'uploading';

export const stageMessages: Record<ExportStage, string> = {
  fetching: 'Fetching interview data...',
  formatting: 'Formatting sessions...',
  generating: 'Generating files...',
  archiving: 'Creating archive...',
  uploading: 'Uploading...',
};

type ExportStageEvent = {
  type: 'stage';
  stage: ExportStage;
  message: string;
  current?: number;
  total?: number;
};

type ExportProgressEvent = {
  type: 'progress';
  stage: 'generating';
  current: number;
  total: number;
};

type ExportCompleteEvent = {
  type: 'complete';
  zipUrl: string;
  zipKey: string;
};

type ExportErrorEvent = {
  type: 'error';
  message: string;
};

export type ExportEvent =
  | ExportStageEvent
  | ExportProgressEvent
  | ExportCompleteEvent
  | ExportErrorEvent;

export function formatSSE(event: ExportEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}
