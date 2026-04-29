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

export type ExportStageEvent = {
  type: 'stage';
  stage: ExportStage;
  message: string;
  current?: number;
  total?: number;
};

export type ExportProgressEvent = {
  type: 'progress';
  stage: 'generating';
  current: number;
  total: number;
};

export type ExportEvent = ExportStageEvent | ExportProgressEvent;
