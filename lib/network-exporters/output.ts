type ExportError = {
  success: false;
  error: Error;
};

type ExportSuccess = {
  success: true;
  filePath: string;
};

export type ExportResult = ExportError | ExportSuccess;

export type ExportReturn = {
  zipUrl?: string;
  zipKey?: string;
  status: 'success' | 'error' | 'cancelled' | 'partial';
  error: string | null;
  successfulExports?: ExportResult[];
  failedExports?: ExportResult[];
};

export type ArchiveResult = {
  path: string;
  completed: ExportResult[];
  rejected: ExportResult[];
};
