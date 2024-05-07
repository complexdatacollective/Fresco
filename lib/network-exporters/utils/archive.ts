import { basename, join } from 'node:path';
import { createWriteStream } from 'node:fs';
import archiver from 'archiver';
import { tmpdir } from 'node:os';

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
 * Write a bundled (zip) from source files
 * @param {string[]} sourcePaths
 * @param {string} targetFileName full FS path to write
 * @param {object} fileWriter fileWriter to use for outputting zip
 * @param {object} filesystem filesystem to use for reading files in to zip
 * @return Returns a promise that resolves to (sourcePath, destinationPath)
 */
const archive = async (
  sourcePaths: string[],
  updateCallback: (percent: number) => void,
) => {
  // https://vercel.com/guides/how-can-i-use-files-in-serverless-functions#using-temporary-storage
  const temporaryDirectory = tmpdir();

  const filenameWithExtension = `networkCanvasExport-${Date.now()}.zip`;
  const writePath = join(temporaryDirectory, filenameWithExtension);

  return new Promise((resolve: (value: string) => void, reject) => {
    const output = createWriteStream(writePath);
    const zip = archiver('zip', archiveOptions);

    output.on('close', () => {
      resolve(writePath);
    });

    output.on('warning', reject);
    output.on('error', reject);

    zip.pipe(output);

    zip.on('warning', reject);
    zip.on('error', reject);
    zip.on('progress', (progress) => {
      const percent =
        (progress.entries.processed / progress.entries.total) * 100;
      updateCallback(percent);
    });

    sourcePaths.forEach((sourcePath) => {
      zip.file(sourcePath, { name: basename(sourcePath) });
    });

    void zip.finalize();
  });
};

export default archive;
