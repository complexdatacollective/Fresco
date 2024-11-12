import type { Codebook } from '@codaco/shared-consts';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getFileExtension, makeFilename } from '../../utils/general';
import getFormatterClass from '../../utils/getFormatterClass';
import type {
  ExportFormat,
  ExportOptions,
  ExportResult,
} from '../../utils/types';
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

  const Formatter = getFormatterClass(exportFormat);
  const extension = getFileExtension(exportFormat);

  const formatter = new Formatter(network, codebook, exportOptions);
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
      reject({
        success: false,
        error,
      });
    });

    formatter.writeToStream(writeStream);
  });
};

export default exportFile;
