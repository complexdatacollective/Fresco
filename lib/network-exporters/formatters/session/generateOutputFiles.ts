import type { InstalledProtocols } from '~/lib/interviewer/store';
import { type SessionsByProtocol } from './groupByProtocolProperty';
import { getFilePrefix } from '../../utils/general';
import { ExportOptions } from '../../utils/exportOptionsSchema';
import exportFile, {
  type ExportFormat,
  type ExportResult,
} from '../../exportFile';
import { partitionByType } from './partitionByType';

export const generateOutputFiles =
  (
    protocols: InstalledProtocols,
    exportFormats: ExportFormat[],
    exportOptions: ExportOptions,
  ) =>
  (unifiedSessions: SessionsByProtocol) => {
    const exportPromises: Promise<ExportResult>[] = [];

    Object.entries(unifiedSessions).forEach(([protocolUID, sessions]) => {
      sessions.forEach((session) => {
        // Skip if sessions don't have required sessionVariables

        const protocol = protocols[protocolUID]!;
        const prefix = getFilePrefix(session);

        // Partitioning the network based on node and edge type so we can create
        // an individual export file for each type
        const partitionedNetworks = partitionByType(
          protocol.codebook,
          session,
          format,
        );

        partitionedNetworks.forEach((partitionedNetwork) => {
          exportPromises.push(
            ...exportFormats.map((format) =>
              exportFile({
                fileName: prefix,
                exportFormat: format,
                network: partitionedNetwork,
                codebook: protocol.codebook,
                exportOptions,
              }),
            ),
          );
        });
      });
    });
  };
