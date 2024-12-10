import type { InstalledProtocols } from '~/lib/interviewer/store';
import type { Codebook } from '~/lib/shared-consts';
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
          const codebook = protocol.codebook as unknown as Codebook; // Needed due to prisma.Json type

          // Split each network into separate files based on format and entity type.
          const partitionedNetworks = partitionByType(
            codebook,
            session,
            format,
          );

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
