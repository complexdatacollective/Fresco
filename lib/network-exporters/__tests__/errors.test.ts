import { describe, expect, it } from 'vitest';
import {
  ArchiveError,
  DatabaseError,
  describeExportError,
  ExportGenerationError,
  FileStorageError,
} from '~/lib/network-exporters/errors';

describe('describeExportError', () => {
  it('detects ENOSPC from a NodeJS.ErrnoException', () => {
    const cause = Object.assign(new Error('write failed'), { code: 'ENOSPC' });
    const err = new FileStorageError({ cause });
    expect(describeExportError(err, 'uploading')).toMatch(/disk space/i);
  });

  it('detects out-of-memory errors via cause inspection', () => {
    const cause = new Error('JavaScript heap out of memory');
    const err = new ArchiveError({ cause });
    expect(describeExportError(err, 'archiving')).toMatch(/memory/i);
  });

  it('returns a tag-aware fallback when the cause is unrecognised', () => {
    const err = new DatabaseError({ cause: new Error('???') });
    expect(describeExportError(err, 'fetching interviews')).toMatch(
      /database connection failed.*fetching interviews/i,
    );
  });

  it('describes per-file ExportGenerationError with file context', () => {
    const err = new ExportGenerationError({
      cause: new Error('bad codebook'),
      format: 'attributeList',
      sessionId: 'session-A',
      partitionEntity: 'person',
    });
    const message = describeExportError(err);
    expect(message).toContain('attributeList');
    expect(message).toContain('person');
    expect(message).toContain('session-A');
  });
});
