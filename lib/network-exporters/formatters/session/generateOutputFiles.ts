import { type Codebook } from '@codaco/protocol-validation';
import { type ExportedProtocol } from '~/actions/interviews';
import { getFilePrefix } from '../../utils/general';
import type {
  ExportFormat,
  ExportOptions,
  ExportResult,
  SessionWithResequencedIDs,
} from '../../utils/types';
import exportFile from './exportFile';
import { partitionByType } from './partitionByType';

export const generateOutputFiles =
  (protocols: Record<string, ExportedProtocol>, exportOptions: ExportOptions) =>
  async (unifiedSessions: Record<string, SessionWithResequencedIDs[]>) => {
    const exportFormats = [
      ...(exportOptions.exportGraphML ? ['graphml'] : []),
      ...(exportOptions.exportCSV ? ['attributeList', 'edgeList', 'ego'] : []),
    ] as ExportFormat[];

    const exportPromises: Promise<ExportResult>[] = [];

    Object.entries(unifiedSessions).forEach(([protocolKey, sessions]) => {
      const protocol = protocols[protocolKey];
      if (!protocol) {
        // eslint-disable-next-line no-console
        console.warn(`No protocol found for key: ${protocolKey}`);
        return;
      }

      const codebook = protocol.codebook as unknown as Codebook; // Needed due to prisma.Json type

      sessions.forEach((session) => {
        const prefix = getFilePrefix(session);

        exportFormats.forEach((format) => {
          // Split each network into separate files based on format and entity type.
          const partitionedNetworks = partitionByType(codebook, session, format);

          partitionedNetworks.forEach((partitionedNetwork) => {
            const exportPromise = exportFile({
              prefix,
              exportFormat: format,
              network: partitionedNetwork,
              codebook,
              exportOptions,
            });

            exportPromises.push(exportPromise);
          });
        });
      });
    });

    const result = await Promise.all(exportPromises);

    return result;
  };
