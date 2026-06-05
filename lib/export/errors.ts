import {
  DatabaseError,
  ExportGenerationError,
  OutputError,
  ProtocolNotFoundError,
  SessionProcessingError,
} from '@codaco/network-exporters/errors';

type CauseKind = 'oom' | 'disk-full' | 'timeout' | 'connection' | 'unknown';

function classifyCause(cause: unknown): CauseKind {
  if (cause && typeof cause === 'object' && 'code' in cause) {
    const { code } = cause;
    if (code === 'ENOSPC') return 'disk-full';
    if (code === 'ETIMEDOUT' || code === 'ESOCKETTIMEDOUT') return 'timeout';
    if (code === 'ECONNREFUSED' || code === 'ECONNRESET') return 'connection';
  }
  const message =
    cause instanceof Error
      ? cause.message.toLowerCase()
      : String(cause).toLowerCase();
  if (message.includes('heap') || message.includes('out of memory'))
    return 'oom';
  if (message.includes('no space')) return 'disk-full';
  if (message.includes('timeout') || message.includes('timed out'))
    return 'timeout';
  if (message.includes('database') || message.includes('prisma'))
    return 'connection';
  return 'unknown';
}

const TAG_FALLBACK_MESSAGE = {
  'NetworkExporters/DatabaseError': 'Database connection failed',
  'NetworkExporters/OutputError': 'Failed to write the export archive',
} as const;

type ClassifiableTag = keyof typeof TAG_FALLBACK_MESSAGE;

function describeClassifiable(
  tag: ClassifiableTag,
  cause: unknown,
  stageSuffix: string,
): string {
  const kind = classifyCause(cause);
  switch (kind) {
    case 'oom':
      return `Export ran out of memory${stageSuffix}. Try exporting fewer interviews at a time.`;
    case 'disk-full':
      return `Export ran out of disk space${stageSuffix}. Please free up server storage and try again.`;
    case 'timeout':
      return `Export timed out${stageSuffix}. Try exporting fewer interviews at a time.`;
    case 'connection':
      return `${TAG_FALLBACK_MESSAGE[tag]}${stageSuffix}.`;
    case 'unknown':
      return `${TAG_FALLBACK_MESSAGE[tag]}${stageSuffix}: ${
        cause instanceof Error ? cause.message : String(cause)
      }`;
  }
}

export function describeExportError(error: unknown, stage?: string): string {
  const stageSuffix = stage ? ` while ${stage}` : '';

  if (error instanceof ExportGenerationError) {
    const partition = error.partitionEntity
      ? ` (${error.partitionEntity})`
      : '';
    const causeMessage =
      error.cause instanceof Error ? error.cause.message : String(error.cause);
    return `Failed to generate ${error.format}${partition} for session ${error.sessionId}: ${causeMessage}`;
  }

  if (error instanceof ProtocolNotFoundError) {
    return 'Could not find the protocol for one of the selected interviews. The protocol may have been deleted.';
  }

  if (error instanceof SessionProcessingError) {
    const kind = classifyCause(error.cause);
    if (kind === 'oom' || kind === 'disk-full' || kind === 'timeout') {
      return describeClassifiable(
        'NetworkExporters/OutputError',
        error.cause,
        stageSuffix,
      );
    }
    const causeMessage =
      error.cause instanceof Error ? error.cause.message : String(error.cause);
    return `Failed to process interview ${error.sessionId} during ${error.stage}: ${causeMessage}`;
  }

  if (error instanceof DatabaseError) {
    return describeClassifiable(
      'NetworkExporters/DatabaseError',
      error.cause,
      stageSuffix,
    );
  }

  if (error instanceof OutputError) {
    return describeClassifiable(
      'NetworkExporters/OutputError',
      error.cause,
      stageSuffix,
    );
  }

  const message =
    error instanceof Error ? error.message : 'An unexpected error occurred';
  return `Export failed${stageSuffix}: ${message}`;
}
