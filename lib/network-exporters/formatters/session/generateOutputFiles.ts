import type { InstalledProtocols } from '~/lib/interviewer/store';
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
  (protocols: InstalledProtocols, exportOptions: ExportOptions) =>
  async (unifiedSessions: Record<string, SessionWithResequencedIDs[]>) => {
    const exportFormats = [
      ...(exportOptions.exportGraphML ? ['graphml'] : []),
      ...(exportOptions.exportCSV ? ['attributeList', 'edgeList', 'ego'] : []),
    ] as ExportFormat[];

    const exportPromises: Promise<ExportResult>[] = [];

    Object.entries(unifiedSessions).forEach(([protocolUID, sessions]) => {
      sessions.forEach((session) => {
        // Skip if sessions don't have required sessionVariables

        const protocol = protocols[protocolUID]!;
        const prefix = getFilePrefix(session);

        exportFormats.forEach((format) => {
          // Partitioning the network based on node and edge type so we can create
          // an individual export file for each type
          const partitionedNetworks = partitionByType(
            protocol.codebook,
            session,
            format,
          );

          partitionedNetworks.forEach((partitionedNetwork) => {
            exportPromises.push(
              exportFile({
                fileName: prefix,
                exportFormat: format,
                network: partitionedNetwork,
                codebook: protocol.codebook,
                exportOptions,
              }),
            );
          });
        });
      });
    });

    const result = await Promise.all(exportPromises);

    return result;
  };
