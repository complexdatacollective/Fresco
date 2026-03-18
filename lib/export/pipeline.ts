import { basename } from 'node:path';
import { Effect } from 'effect';
import archive from '~/lib/network-exporters/formatters/session/archive';
import { generateOutputFiles } from '~/lib/network-exporters/formatters/session/generateOutputFiles';
import { formatExportableSessions } from '~/lib/network-exporters/formatters/formatExportableSessions';
import groupByProtocolProperty from '~/lib/network-exporters/formatters/session/groupByProtocolProperty';
import { insertEgoIntoSessionNetworks } from '~/lib/network-exporters/formatters/session/insertEgoIntoSessionNetworks';
import { resequenceIds } from '~/lib/network-exporters/formatters/session/resequenceIds';
import type {
  ExportOptions,
  ExportReturn,
} from '~/lib/network-exporters/utils/types';
import {
  ArchiveError,
  ExportGenerationError,
  FileStorageError,
  getUserMessage,
} from '~/lib/export/errors';
import { FileStorage } from '~/lib/export/services/FileStorage';
import { FileSystem } from '~/lib/export/services/FileSystem';
import {
  InterviewRepository,
  type InterviewExportData,
} from '~/lib/export/services/InterviewRepository';

export type ExportedProtocol = InterviewExportData['protocol'];

function buildProtocolsMap(
  sessions: InterviewExportData[],
): Record<string, ExportedProtocol> {
  const protocolsMap = new Map<string, ExportedProtocol>();
  sessions.forEach((session) => {
    protocolsMap.set(session.protocol.hash, session.protocol);
  });
  return Object.fromEntries(protocolsMap);
}

export const exportPipeline = (
  interviewIds: string[],
  exportOptions: ExportOptions,
) =>
  Effect.gen(function* () {
    const repo = yield* InterviewRepository;
    const fs = yield* FileSystem;
    const fileStorage = yield* FileStorage;

    const sessions = yield* repo
      .getForExport(interviewIds)
      .pipe(Effect.withSpan('export.fetch'));

    const protocols = buildProtocolsMap(sessions);
    const formatted = formatExportableSessions(sessions);
    const withEgo = insertEgoIntoSessionNetworks(formatted);
    const grouped = groupByProtocolProperty(withEgo);
    const resequenced = resequenceIds(grouped);

    const exportResults = yield* Effect.tryPromise({
      try: () => generateOutputFiles(protocols, exportOptions)(resequenced),
      catch: (error) =>
        new ExportGenerationError({
          cause: error,
          userMessage: getUserMessage(error, 'generating export files'),
        }),
    }).pipe(Effect.withSpan('export.generateFiles'));

    const tempFilePaths = exportResults
      .filter((r): r is Extract<typeof r, { success: true }> => r.success)
      .map((r) => r.filePath);

    const archiveResult = yield* Effect.tryPromise({
      try: () => archive(exportResults),
      catch: (error) =>
        new ArchiveError({
          cause: error,
          userMessage: getUserMessage(error, 'creating zip archive'),
        }),
    }).pipe(Effect.withSpan('export.archive'));

    tempFilePaths.push(archiveResult.path);

    const fileName = basename(archiveResult.path);
    if (!/^networkCanvasExport-\d+\.zip$/.test(fileName)) {
      return yield* Effect.fail(
        new FileStorageError({
          cause: new Error(`Invalid archive filename: ${fileName}`),
          userMessage: 'Export failed due to an internal error.',
        }),
      );
    }

    const archiveBuffer = yield* fs.readFile(archiveResult.path);
    const { url, key } = yield* fileStorage
      .upload(archiveBuffer, fileName)
      .pipe(Effect.withSpan('export.upload'));

    yield* Effect.forEach(
      tempFilePaths,
      (path) => fs.deleteFile(path).pipe(Effect.catchAll(() => Effect.void)),
      { discard: true },
    );

    return {
      zipUrl: url,
      zipKey: key,
      status: archiveResult.rejected.length
        ? ('partial' as const)
        : ('success' as const),
      error: archiveResult.rejected.length ? 'Some exports failed' : null,
      successfulExports: archiveResult.completed,
      failedExports: archiveResult.rejected,
    } satisfies ExportReturn;
  });
