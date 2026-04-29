import { Data } from 'effect';

export class FileStorageError extends Data.TaggedError('FileStorageError')<{
  readonly cause: unknown;
  readonly userMessage: string;
}> {}

export class AssetStorageError extends Data.TaggedError('AssetStorageError')<{
  readonly cause: unknown;
  readonly userMessage: string;
}> {}

export function getUserMessage(error: unknown, stage: string): string {
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error);

  if (message.includes('heap') || message.includes('memory')) {
    return `Export ran out of memory while ${stage}. Try exporting fewer interviews at a time.`;
  }

  if (message.includes('enospc') || message.includes('no space')) {
    return `Export ran out of disk space while ${stage}. Please free up server storage and try again.`;
  }

  if (
    message.includes('timeout') ||
    message.includes('timedout') ||
    message.includes('timed out') ||
    message.includes('etimedout') ||
    message.includes('econnreset')
  ) {
    return `Export timed out while ${stage}. Try exporting fewer interviews at a time.`;
  }

  if (
    message.includes('econnrefused') ||
    message.includes('database') ||
    message.includes('prisma')
  ) {
    return `Database connection failed while ${stage}. Please try again later.`;
  }

  const originalMessage =
    error instanceof Error ? error.message : String(error);
  return `Export failed while ${stage}: ${originalMessage}`;
}
