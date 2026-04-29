import type { Codebook } from '@codaco/protocol-validation';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getFileExtension, makeFilename } from '../utils/general';
import { getFormatter } from '../utils/getFormatter';
import type { ExportFormat, ExportOptions } from '../options';
import type { ExportResult } from '../output';
import type { partitionByType } from './partitionByType';

export type ExportFileNetwork = ReturnType<typeof partitionByType>[number];

const exportFile = ({
  prefix,
  exportFormat,
  network,
  codebook,
  exportOptions,
}: {
  prefix: string;
  exportFormat: ExportFormat;
  network: ExportFileNetwork;
  codebook: Codebook;
  exportOptions: ExportOptions;
}): Promise<ExportResult> => {
  const outDir = tmpdir();

  const toReadable = getFormatter(exportFormat);
  const extension = getFileExtension(exportFormat);
  const outputName = makeFilename(
    prefix,
    network.partitionEntity,
    exportFormat,
    extension,
  );

  const filePath = join(outDir, outputName);

  const writeStream = fs.createWriteStream(filePath);

  return new Promise((resolve, reject) => {
    writeStream.on('finish', () => {
      resolve({
        success: true,
        filePath,
      });
    });
    writeStream.on('error', (error) => {
      // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
      reject({
        success: false,
        error,
      });
    });

    const inputStream = toReadable(network, codebook, exportOptions);
    inputStream.pipe(writeStream);
  });
};

export default exportFile;
