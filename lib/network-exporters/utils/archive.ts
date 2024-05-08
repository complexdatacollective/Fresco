import archiver from 'archiver';
import { createWriteStream } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import type { ExportResult } from './types';

// const zlibFastestCompression = 1;
// const zlibBestCompression = 9;
const zlibDefaultCompression = 1;

// Use zlib default: compromise speed & size
// archiver overrides zlib's default (with 'best speed'), so we need to provide it
const archiveOptions = {
  zlib: { level: zlibDefaultCompression },
  store: true,
};

/**
 * Write a zip from source files
 */
const archive = async (results: Promise<ExportResult[]>) => {
  const exportResults = await results;
  const temporaryDirectory = tmpdir();

  const filenameWithExtension = `networkCanvasExport-${Date.now()}.zip`;
  const writePath = join(temporaryDirectory, filenameWithExtension);

  return new Promise(
    (
      resolve: (value: {
        path: string;
        completed: ExportResult[];
        rejected: ExportResult[];
      }) => void,
      reject,
    ) => {
      const completed: ExportResult[] = [];
      const rejected: ExportResult[] = [];

      const output = createWriteStream(writePath);
      const zip = archiver('zip', archiveOptions);

      output.on('close', () => {
        resolve({
          path: writePath,
          completed,
          rejected,
        });
      });

      output.on('warning', reject);
      output.on('error', reject);

      zip.pipe(output);

      zip.on('warning', reject);
      zip.on('error', reject);

      exportResults.forEach((exportResult) => {
        if (exportResult.success) {
          const { path } = exportResult;
          zip.file(path, { name: basename(path) });
          completed.push(exportResult);
        } else {
          rejected.push(exportResult);
        }

        void zip.finalize();
      });
    },
  );
};

export default archive;
