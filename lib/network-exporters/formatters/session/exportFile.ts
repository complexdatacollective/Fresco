import fs from 'node:fs';
import { join } from 'node:path';
import { getFileExtension, makeFilename } from '../../utils/general';
import getFormatterClass from '../../utils/getFormatterClass';
import { tmpdir } from 'node:os';
import { type ExportOptions } from '../../utils/exportOptionsSchema';
import { type Codebook } from '@codaco/shared-consts';

export type ExportFormat = 'graphml' | 'attributeList' | 'edgeList' | 'ego';

type ExportFileProps = {
  fileName: string;
  exportFormat: ExportFormat;
  network: unknown;
  codebook: Codebook;
  exportOptions: ExportOptions;
};

type ExportError = {
  id: string;
  success: false;
  error: Error;
};

type ExportSuccess = {
  id: string;
  success: true;
  path: string;
};

export type ExportResult = ExportError | ExportSuccess;

const exportFile = ({
  fileName: namePrefix,
  exportFormat,
  network,
  codebook,
  exportOptions,
}: ExportFileProps): Promise<ExportResult> => {
  const outDir = tmpdir();

  const partitionedEntityName = network.partitionEntity;

  const Formatter = getFormatterClass(exportFormat);
  const extension = getFileExtension(exportFormat);

  const formatter = new Formatter(network, codebook, exportOptions);
  const outputName = makeFilename(
    namePrefix,
    partitonedEntityName,
    exportFormat,
    extension,
  );

  const filePath = join(outDir, outputName);

  const writeStream = fs.createWriteStream(filePath);

  return new Promise((resolve, reject) => {
    writeStream.on('finish', () => {
      resolve(filePath);
    });
    writeStream.on('error', (err) => {
      reject(err);
    });

    const streamController = formatter.writeToStream(writeStream);
  });
};

export default exportFile;
