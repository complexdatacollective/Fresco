import type { ExportGenerationError } from '~/lib/network-exporters/errors';
import type { ExportFormat } from '~/lib/network-exporters/options';

type ExportResultBase = {
  readonly format: ExportFormat;
  readonly sessionId: string;
  readonly partitionEntity?: string;
};

export type ExportSuccess = ExportResultBase & {
  readonly success: true;
  readonly filePath: string;
};

export type ExportFailure = ExportResultBase & {
  readonly success: false;
  readonly error: ExportGenerationError;
};

export type ExportResult = ExportSuccess | ExportFailure;

export type ExportReturn = {
  readonly zipUrl: string;
  readonly zipKey: string;
  readonly status: 'success' | 'partial';
  readonly successfulExports: ExportSuccess[];
  readonly failedExports: ExportFailure[];
};

export type ArchiveResult = {
  readonly path: string;
  readonly fileName: string;
  readonly completed: ExportSuccess[];
  readonly rejected: ExportFailure[];
};
