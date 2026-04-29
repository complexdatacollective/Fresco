import { sessionProperty } from '@codaco/shared-consts';
import { Effect, Queue, Ref } from 'effect';
import { invariant } from 'es-toolkit';
import os from 'node:os';
import type { ExportEvent } from '~/lib/network-exporters/events';
import type { ExportedProtocol } from '~/lib/network-exporters/pipeline';
import type {
  ExportFormat,
  ExportOptions,
} from '~/lib/network-exporters/options';
import type { ExportResult } from '~/lib/network-exporters/output';
import type { SessionWithResequencedIDs } from '~/lib/network-exporters/input';
import { getFilePrefix } from '../utils/general';
import exportFile from './exportFile';
import { partitionByType } from './partitionByType';

type ExportItem = {
  prefix: string;
  exportFormat: ExportFormat;
  network: ReturnType<typeof partitionByType>[number];
  codebook: Parameters<typeof exportFile>[0]['codebook'];
  exportOptions: ExportOptions;
  sessionId: string;
};

function buildExportItems(
  protocols: Record<string, ExportedProtocol>,
  exportOptions: ExportOptions,
  unifiedSessions: Record<string, SessionWithResequencedIDs[]>,
): ExportItem[] {
  const exportFormats: ExportFormat[] = [
    ...(exportOptions.exportGraphML ? (['graphml'] as const) : []),
    ...(exportOptions.exportCSV
      ? (['attributeList', 'edgeList', 'ego'] as const)
      : []),
  ];

  const items: ExportItem[] = [];
  Object.entries(unifiedSessions).forEach(([protocolKey, sessions]) => {
    const codebook = protocols[protocolKey]?.codebook;
    invariant(codebook, `No protocol found for key: ${protocolKey}`);

    sessions.forEach((session) => {
      const prefix = getFilePrefix(session);
      exportFormats.forEach((format) => {
        const partitionedNetworks = partitionByType(codebook, session, format);
        partitionedNetworks.forEach((partitionedNetwork) => {
          items.push({
            prefix,
            exportFormat: format,
            network: partitionedNetwork,
            codebook,
            exportOptions,
            sessionId: session.sessionVariables[sessionProperty],
          });
        });
      });
    });
  });
  return items;
}

export const generateOutputFilesEffect = (
  protocols: Record<string, ExportedProtocol>,
  exportOptions: ExportOptions,
  unifiedSessions: Record<string, SessionWithResequencedIDs[]>,
  progressQueue: Queue.Enqueue<ExportEvent>,
) =>
  Effect.gen(function* () {
    const items = buildExportItems(protocols, exportOptions, unifiedSessions);
    const total = items.length;
    const concurrency = exportOptions.concurrency ?? os.cpus().length;
    const completedRef = yield* Ref.make(0);

    yield* Queue.offer(progressQueue, {
      type: 'stage',
      stage: 'generating',
      message: 'Generating files...',
      current: 0,
      total,
    });

    const results: ExportResult[] = yield* Effect.forEach(
      items,
      (item) =>
        exportFile(item).pipe(
          Effect.tap(() =>
            Ref.updateAndGet(completedRef, (n) => n + 1).pipe(
              Effect.tap((current) =>
                Queue.offer(progressQueue, {
                  type: 'progress',
                  stage: 'generating',
                  current,
                  total,
                }),
              ),
            ),
          ),
        ),
      { concurrency },
    );

    return results;
  });
