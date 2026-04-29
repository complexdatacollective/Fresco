import type { Codebook } from '@codaco/protocol-validation';
import { Effect } from 'effect';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Readable } from 'node:stream';
import { ExportGenerationError } from '~/lib/network-exporters/errors';
import type {
  ExportFormat,
  ExportOptions,
} from '~/lib/network-exporters/options';
import type { ExportResult } from '~/lib/network-exporters/output';
import { getFileExtension, makeFilename } from '../utils/general';
import { getFormatter } from '../utils/getFormatter';
import type { partitionByType } from './partitionByType';

export type ExportFileNetwork = ReturnType<typeof partitionByType>[number];

type ExportFileParams = {
  prefix: string;
  exportFormat: ExportFormat;
  network: ExportFileNetwork;
  codebook: Codebook;
  exportOptions: ExportOptions;
  sessionId: string;
};

const exportFile = (params: ExportFileParams): Effect.Effect<ExportResult> =>
  Effect.async<ExportResult>((resume) => {
    const {
      prefix,
      exportFormat,
      network,
      codebook,
      exportOptions,
      sessionId,
    } = params;

    const toReadable = getFormatter(exportFormat);
    const extension = getFileExtension(exportFormat);
    const outputName = makeFilename(
      prefix,
      network.partitionEntity,
      exportFormat,
      extension,
    );
    const filePath = join(tmpdir(), outputName);

    const failure = (cause: unknown): ExportResult => ({
      success: false,
      format: exportFormat,
      sessionId,
      partitionEntity: network.partitionEntity,
      error: new ExportGenerationError({
        cause,
        format: exportFormat,
        sessionId,
        partitionEntity: network.partitionEntity,
      }),
    });

    const success: ExportResult = {
      success: true,
      filePath,
      format: exportFormat,
      sessionId,
      partitionEntity: network.partitionEntity,
    };

    let inputStream: Readable;
    try {
      inputStream = toReadable(network, codebook, exportOptions);
    } catch (error) {
      resume(Effect.succeed(failure(error)));
      return;
    }

    const writeStream = fs.createWriteStream(filePath);
    let settled = false;
    const settle = (result: ExportResult) => {
      if (settled) return;
      settled = true;
      resume(Effect.succeed(result));
    };

    inputStream.on('error', (error) => settle(failure(error)));
    writeStream.on('error', (error) => settle(failure(error)));
    writeStream.on('finish', () => settle(success));

    inputStream.pipe(writeStream);

    return Effect.sync(() => {
      inputStream.destroy();
      writeStream.destroy();
    });
  });

export default exportFile;
