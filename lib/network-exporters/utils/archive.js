/* eslint-disable global-require */
import dynamic from 'next/dynamic';
import path from 'path';

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
const archive = (
  sourcePaths,
  tempDir,
  filename,
  updateCallback,
  shouldContinue,
) => {
  const filenameWithExtension = `${filename}.zip`;
  const writePath = path.join(tempDir, filenameWithExtension);

  return new Promise((resolve, reject) => {
    const fs = dynamic(() => import('fs-extra'));
    const archiver = dynamic(() => import('archiver'));
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
      // Check if the process has been cancelled by the user
      if (!shouldContinue()) {
        zip.abort();
        resolve();
      }
      const percent =
        (progress.entries.processed / progress.entries.total) * 100;
      updateCallback(percent);
    });

    sourcePaths.forEach((sourcePath) => {
      zip.file(sourcePath, { name: path.basename(sourcePath) });
    });

    zip.finalize();
  });
};

// This is adapted from Architect; consider using `extract` as well
export default archive;
