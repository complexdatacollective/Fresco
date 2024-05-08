import archiver from 'archiver';
import { createWriteStream } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import type { ArchiveResult, ExportResult } from '../../utils/types';

/**
 * Write a zip from source files
 */
const archive = async (exportResults: ExportResult[]) => {
  const temporaryDirectory = tmpdir();

  const filenameWithExtension = `networkCanvasExport-${Date.now()}.zip`;
  const writePath = join(temporaryDirectory, filenameWithExtension);

  const result = await new Promise(
    (resolve: (value: ArchiveResult) => void, reject) => {
      const completed: ExportResult[] = [];
      const rejected: ExportResult[] = [];

      const output = createWriteStream(writePath);
      const zip = archiver('zip', {
        zlib: { level: 1 }, // 1 = low 9 = high
        store: true, // Seems to skip compression entirely?
      });

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

  return result;
};

export default archive;
