import archiver from 'archiver';
import { createWriteStream } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import type {
  ArchiveResult,
  ExportFailure,
  ExportResult,
  ExportSuccess,
} from '~/lib/network-exporters/output';

const ARCHIVE_PREFIX = 'networkCanvasExport';

const archive = async (
  exportResults: ExportResult[],
): Promise<ArchiveResult> => {
  const fileName = `${ARCHIVE_PREFIX}-${Date.now()}.zip`;
  const writePath = join(tmpdir(), fileName);

  return new Promise<ArchiveResult>((resolve, reject) => {
    const completed: ExportSuccess[] = [];
    const rejected: ExportFailure[] = [];
    const writeStream = createWriteStream(writePath);

    writeStream.on('close', () =>
      resolve({ path: writePath, fileName, completed, rejected }),
    );
    writeStream.on('warning', reject);
    writeStream.on('error', reject);

    const zip = archiver('zip', { zlib: { level: 1 }, store: true });
    zip.pipe(writeStream);
    zip.on('warning', reject);
    zip.on('error', reject);

    for (const result of exportResults) {
      if (result.success) {
        zip.file(result.filePath, { name: basename(result.filePath) });
        completed.push(result);
      } else {
        rejected.push(result);
      }
    }

    void zip.finalize();
  });
};

export default archive;
