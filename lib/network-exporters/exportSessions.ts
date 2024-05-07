import archive from './utils/archive';
import { uploadZipToUploadThing } from './formatters/session/uploadZipToUploadThing';
import type { ExportOptions } from './utils/exportOptionsSchema';
import type { InstalledProtocols } from '../interviewer/store';
import { insertEgoIntoSessionNetworks } from './formatters/session/insertEgoIntoSessionnetworks';
import type { FormattedSession } from './formatters/session/types';
import groupByProtocolProperty from './formatters/session/groupByProtocolProperty';
import { resequenceIds } from './formatters/session/resequenceIds';
import { generateOutputFiles } from './formatters/session/generateOutputFiles';
import { pipe } from 'effect';
import type {
  ExportResult,
  ExportFormat,
} from './formatters/session/exportFile';

export type ExportReturn = {
  status: 'success' | 'error' | 'cancelled' | 'partial';
  error: string | null;
  successfulExports?: ExportResult[];
  failedExports?: ExportResult[];
};

const defaultExportOptions: ExportOptions = {
  exportGraphML: true,
  exportCSV: true,
  globalOptions: {
    useScreenLayoutCoordinates: true,
    screenLayoutHeight: 1080,
    screenLayoutWidth: 1920,
  },
};

export default async function exportSessions(
  sessions: FormattedSession[],
  protocols: InstalledProtocols,
  exportOptions: ExportOptions = defaultExportOptions,
) {
  const exportFormats = [
    ...(exportOptions.exportGraphML ? ['graphml'] : []),
    ...(exportOptions.exportCSV ? ['attributeList', 'edgeList', 'ego'] : []),
  ] as ExportFormat[];

  try {
    const result = await pipe(
      sessions,
      insertEgoIntoSessionNetworks,
      groupByProtocolProperty,
      resequenceIds,
      generateOutputFiles(protocols, exportFormats, exportOptions),
      archive,
      uploadZipToUploadThing,
    );

    return result;
  } catch (error) {
    // Do something.
    return {
      status: 'error',
      error: 'An error occurred',
    };
  }
}
