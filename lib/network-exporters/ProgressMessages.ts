export const ProgressMessages = {
  Begin: {
    progress: 0,
    statusText: 'Starting export...',
  },
  Formatting: {
    progress: 10,
    statusText: 'Formatting network data...',
  },
  Merging: {
    progress: 20,
    statusText: 'Merging sessions by protocol...',
  },
  ExportSession: (sessionExportCount: number, sessionExportTotal: number) => ({
    progress: 30 + ((50 - 30) * sessionExportCount) / sessionExportTotal,
    statusText: `Encoding session ${sessionExportCount} of ${sessionExportTotal}...`,
  }),
  ZipStart: {
    progress: 60,
    statusText: 'Creating zip archive...',
  },
  ZipProgress: (percent: number) => ({
    progress: 60 + (95 - 60) * (percent / 100), // between ZipStart and Saving
    statusText: 'Zipping files...',
  }),
  Saving: {
    progress: 95,
    statusText: 'Saving file...',
  },
  Finished: {
    progress: 100,
    statusText: 'Export finished.',
  },
  Cancelled: {
    progress: 100,
    statusText: 'Export cancelled.',
  },
} as const;

export type ProgressMessage = {
  progress: number;
  statusText: string;
};

export type ExportEventTypes = {
  'begin': [ProgressMessage];
  'update': [ProgressMessage];
  'error': [ProgressMessage];
  'finished': [ProgressMessage];
  'session-exported': [ProgressMessage];
};
