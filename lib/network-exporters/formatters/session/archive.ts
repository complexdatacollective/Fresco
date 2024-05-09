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

      const writeStream = createWriteStream(writePath);

      writeStream.on('close', async () => {
        resolve({
          path: writePath,
          completed,
          rejected,
        });
      });

      writeStream.on('warning', reject);
      writeStream.on('error', reject);

      const zip = archiver('zip', {
        zlib: { level: 1 }, // 1 = low 9 = high
        store: true, // Seems to skip compression entirely?
      });

      zip.pipe(writeStream);

      zip.on('warning', reject);
      zip.on('error', reject);

      exportResults.forEach((exportResult) => {
        if (exportResult.success) {
          const { filePath } = exportResult;
          zip.file(filePath, { name: basename(filePath) });
          completed.push(exportResult);
        } else {
          rejected.push(exportResult);
        }
      });

      void zip.finalize(); // Will trigger writeStream close event
    },
  );

  return result;
};

export default archive;
