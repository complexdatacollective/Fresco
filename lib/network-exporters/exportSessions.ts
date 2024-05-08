import { pipe } from 'effect';
import type { InstalledProtocols } from '../interviewer/store';
import { generateOutputFiles } from './formatters/session/generateOutputFiles';
import groupByProtocolProperty from './formatters/session/groupByProtocolProperty';
import { insertEgoIntoSessionNetworks } from './formatters/session/insertEgoIntoSessionnetworks';
import { resequenceIds } from './formatters/session/resequenceIds';
import { uploadZipToUploadThing } from './formatters/session/uploadZipToUploadThing';
import archive from './utils/archive';
import type { ExportOptions, FormattedSession } from './utils/types';

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
  try {
    const test = Promise.resolve(sessions)
      .then(insertEgoIntoSessionNetworks)
      .then(groupByProtocolProperty)
      .then(resequenceIds)
      .then(generateOutputFiles(protocols, exportOptions))
      .then(archive)
      .then(uploadZipToUploadThing);

    const result = await pipe(
      sessions,
      insertEgoIntoSessionNetworks,
      groupByProtocolProperty,
      resequenceIds,
      generateOutputFiles(protocols, exportOptions),
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
