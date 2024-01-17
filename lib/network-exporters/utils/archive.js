/* eslint-disable global-require */
import { basename, join } from 'node:path';
import fs from 'node:fs';
import archiver from 'archiver';

// const zlibFastestCompression = 1;
// const zlibBestCompression = 9;
const zlibDefaultCompression = -1;

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
const archive = (sourcePaths, tempDir, filename, updateCallback) => {
  const filenameWithExtension = `${filename}.zip`;
  const writePath = join(tempDir, filenameWithExtension);

  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(writePath);
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

    zip.finalize();
  });
};

// This is adapted from Architect; consider using `extract` as well
export default archive;
