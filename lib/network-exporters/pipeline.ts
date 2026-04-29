import { Effect, Queue } from 'effect';
import archive from '~/lib/network-exporters/session/archive';
import { generateOutputFilesEffect } from '~/lib/network-exporters/session/generateOutputFiles';
import { formatExportableSessions } from '~/lib/network-exporters/formatters/formatExportableSessions';
import groupByProtocolProperty from '~/lib/network-exporters/session/groupByProtocolProperty';
import { insertEgoIntoSessionNetworks } from '~/lib/network-exporters/session/insertEgoIntoSessionNetworks';
import { resequenceIds } from '~/lib/network-exporters/session/resequenceIds';
import { ArchiveError } from '~/lib/network-exporters/errors';
import {
  type ExportEvent,
  stageMessages,
} from '~/lib/network-exporters/events';
import type {
  InterviewExportInput,
  ProtocolExportInput,
} from '~/lib/network-exporters/input';
import type { ExportOptions } from '~/lib/network-exporters/options';
import type { ExportReturn } from '~/lib/network-exporters/output';
import { FileStorage } from '~/lib/network-exporters/services/FileStorage';
import { FileSystem } from '~/lib/network-exporters/services/FileSystem';
import { InterviewRepository } from '~/lib/network-exporters/services/InterviewRepository';

export type ExportedProtocol = ProtocolExportInput;

function buildProtocolsMap(
  sessions: InterviewExportInput[],
): Record<string, ProtocolExportInput> {
  const protocolsMap = new Map<string, ProtocolExportInput>();
  sessions.forEach((session) => {
    protocolsMap.set(session.protocol.hash, session.protocol);
  });
  return Object.fromEntries(protocolsMap);
}

export const exportPipeline = (
  interviewIds: string[],
  exportOptions: ExportOptions,
  progressQueue: Queue.Enqueue<ExportEvent>,
) =>
  Effect.gen(function* () {
    const repo = yield* InterviewRepository;
    const fs = yield* FileSystem;
    const fileStorage = yield* FileStorage;

    yield* Queue.offer(progressQueue, {
      type: 'stage',
      stage: 'fetching',
      message: stageMessages.fetching,
    });

    const sessions = yield* repo
      .getForExport(interviewIds)
      .pipe(Effect.withSpan('export.fetch'));

    yield* Queue.offer(progressQueue, {
      type: 'stage',
      stage: 'formatting',
      message: stageMessages.formatting,
    });

    const protocols = buildProtocolsMap(sessions);
    const formatted = formatExportableSessions(sessions);
    const withEgo = insertEgoIntoSessionNetworks(formatted);
    const grouped = groupByProtocolProperty(withEgo);
    const resequenced = resequenceIds(grouped);

    const exportResults = yield* generateOutputFilesEffect(
      protocols,
      exportOptions,
      resequenced,
      progressQueue,
    ).pipe(Effect.withSpan('export.generateFiles'));

    yield* Queue.offer(progressQueue, {
      type: 'stage',
      stage: 'archiving',
      message: stageMessages.archiving,
    });

    const archiveResult = yield* Effect.tryPromise({
      try: () => archive(exportResults),
      catch: (error) => new ArchiveError({ cause: error }),
    }).pipe(Effect.withSpan('export.archive'));

    const tempPaths = exportResults
      .filter((r): r is Extract<typeof r, { success: true }> => r.success)
      .map((r) => r.filePath);
    tempPaths.push(archiveResult.path);

    return yield* Effect.gen(function* () {
      yield* Queue.offer(progressQueue, {
        type: 'stage',
        stage: 'uploading',
        message: stageMessages.uploading,
      });

      const archiveStream = yield* fs.readStream(archiveResult.path);
      const { key } = yield* fileStorage
        .upload(archiveStream, archiveResult.fileName)
        .pipe(Effect.withSpan('export.upload'));

      const downloadUrl = yield* fileStorage
        .getDownloadUrl(key)
        .pipe(Effect.withSpan('export.getDownloadUrl'));

      const result: ExportReturn = {
        zipUrl: downloadUrl,
        zipKey: key,
        status: archiveResult.rejected.length ? 'partial' : 'success',
        successfulExports: archiveResult.completed,
        failedExports: archiveResult.rejected,
      };
      return result;
    }).pipe(
      Effect.ensuring(
        Effect.forEach(
          tempPaths,
          (path) =>
            fs.deleteFile(path).pipe(Effect.catchAll(() => Effect.void)),
          { discard: true },
        ),
      ),
    );
  });
