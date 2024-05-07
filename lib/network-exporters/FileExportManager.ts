import { merge } from 'lodash';
import archive from './utils/archive';
import { uploadZipToUploadThing } from './utils/uploadZipToUploadThing';
import type { ExportOptions } from './utils/exportOptionsSchema';
import type { InstalledProtocols } from '../interviewer/store';
import { insertEgoIntoSessionNetworks } from './formatters/session/insertEgoIntoSessionnetworks';
import type { FormattedSession } from './formatters/session/types';
import groupByProtocolProperty from './formatters/session/groupByProtocolProperty';
import { handleUnionOption } from './formatters/session/unionOfNetworks';
import { resequenceIds } from './formatters/session/resequenceIds';
import { generateOutputFiles } from './formatters/session/generateOutputFiles';
import { pipe } from 'effect';

// Where we want to get to with the return type of exportSessions
type ExportReturn = () => Promise<{
  status: 'success' | 'error' | 'cancelled' | 'partial';
  error: string | null;
  successfulExports?: string[];
  failedExports?: Record<string, string>;
}>;

class FileExportManager {
  private exportOptions: ExportOptions = {
    exportGraphML: true,
    exportCSV: true,
    globalOptions: {
      unifyNetworks: false,
      useScreenLayoutCoordinates: true,
      screenLayoutHeight: 1080,
      screenLayoutWidth: 1920,
    },
  };

  constructor(exportOptions?: ExportOptions) {
    this.exportOptions = merge(this.exportOptions, exportOptions);
  }

  async exportSessions(
    sessions: FormattedSession[],
    protocols: InstalledProtocols,
  ) {
    try {
      const result = await pipe(
        sessions,
        insertEgoIntoSessionNetworks,
        groupByProtocolProperty,
        handleUnionOption(this.exportOptions.globalOptions.unifyNetworks),
        resequenceIds,
        generateOutputFiles(protocols),
        archive,
        uploadZipToUploadThing,
      );

      return result;
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
      };
    }
  }
}

export default FileExportManager;
