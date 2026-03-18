import { Effect, Queue, Ref } from 'effect';
import { invariant } from 'es-toolkit';
import { ExportGenerationError, getUserMessage } from '~/lib/export/errors';
import type { ExportEvent } from '~/lib/export/exportEvents';
import { type ExportedProtocol } from '~/lib/export/pipeline';
import { getFilePrefix } from '../../utils/general';
import type {
  ExportFormat,
  ExportOptions,
  SessionWithResequencedIDs,
} from '../../utils/types';
import exportFile from './exportFile';
import { partitionByType } from './partitionByType';

type ExportItem = {
  prefix: string;
  exportFormat: ExportFormat;
  network: ReturnType<typeof partitionByType>[number];
  codebook: Parameters<typeof exportFile>[0]['codebook'];
  exportOptions: ExportOptions;
};

function buildExportItems(
  protocols: Record<string, ExportedProtocol>,
  exportOptions: ExportOptions,
  unifiedSessions: Record<string, SessionWithResequencedIDs[]>,
): ExportItem[] {
  const exportFormats = [
    ...(exportOptions.exportGraphML ? ['graphml'] : []),
    ...(exportOptions.exportCSV ? ['attributeList', 'edgeList', 'ego'] : []),
  ] as ExportFormat[];

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
  progressQueue: Queue.Queue<ExportEvent>,
) =>
  Effect.gen(function* () {
    const items = buildExportItems(protocols, exportOptions, unifiedSessions);
    const total = items.length;
    const completedRef = yield* Ref.make(0);

    yield* Queue.offer(progressQueue, {
      type: 'stage',
      stage: 'generating',
      message: 'Generating files...',
      current: 0,
      total,
    });

    const results = yield* Effect.forEach(
      items,
      (item) =>
        Effect.tryPromise({
          try: () => exportFile(item),
          catch: (error) =>
            new ExportGenerationError({
              cause: error,
              userMessage: getUserMessage(error, 'generating export files'),
            }),
        }).pipe(
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
      { concurrency: 'unbounded' },
    );

    return results;
  });

export const generateOutputFiles =
  (protocols: Record<string, ExportedProtocol>, exportOptions: ExportOptions) =>
  async (unifiedSessions: Record<string, SessionWithResequencedIDs[]>) => {
    const items = buildExportItems(protocols, exportOptions, unifiedSessions);
    const result = await Promise.all(items.map((item) => exportFile(item)));
    return result;
  };
