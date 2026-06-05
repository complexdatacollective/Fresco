import { describe, expect, it } from 'vitest';
import {
  DatabaseError,
  ExportGenerationError,
  OutputError,
  ProtocolNotFoundError,
  SessionProcessingError,
} from '@codaco/network-exporters/errors';
import { describeExportError } from '~/lib/export/errors';

describe('describeExportError', () => {
  describe('cause classifier', () => {
    it('returns disk-space message when cause has ENOSPC code', () => {
      const cause = Object.assign(new Error('write failed'), {
        code: 'ENOSPC',
      });
      const err = new OutputError({ cause });
      expect(describeExportError(err, 'uploading')).toMatch(/disk space/i);
    });

    it('returns out-of-memory message when cause mentions heap', () => {
      const cause = new Error('JavaScript heap out of memory');
      const err = new OutputError({ cause });
      expect(describeExportError(err, 'archiving')).toMatch(/memory/i);
    });

    it('returns timeout message when cause has ETIMEDOUT code', () => {
      const cause = Object.assign(new Error('socket timeout'), {
        code: 'ETIMEDOUT',
      });
      const err = new DatabaseError({ cause });
      expect(describeExportError(err)).toMatch(/timed out/i);
    });

    it('returns connection message when cause has ECONNREFUSED code', () => {
      const cause = Object.assign(new Error('refused'), {
        code: 'ECONNREFUSED',
      });
      const err = new DatabaseError({ cause });
      expect(describeExportError(err, 'fetching')).toMatch(
        /database connection failed.*fetching/i,
      );
    });

    it('falls back to tag-aware copy with the cause message when classifier returns unknown', () => {
      const err = new DatabaseError({ cause: new Error('wat') });
      expect(describeExportError(err, 'fetching interviews')).toContain('wat');
    });
  });

  describe('per-tag copy', () => {
    it('describes ExportGenerationError with format/partition/session context', () => {
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
      expect(message).toContain('bad codebook');
    });

    it('describes ProtocolNotFoundError with definitive copy and no classifier', () => {
      const err = new ProtocolNotFoundError({
        hash: 'abc123',
        sessionId: 'session-A',
      });
      const message = describeExportError(err);
      expect(message).toMatch(/protocol/i);
      expect(message).toMatch(/deleted/i);
    });

    it('describes SessionProcessingError with stage and session context', () => {
      const err = new SessionProcessingError({
        cause: new Error('boom'),
        stage: 'format',
        sessionId: 'session-A',
      });
      const message = describeExportError(err);
      expect(message).toContain('session-A');
      expect(message).toContain('format');
      expect(message).toContain('boom');
    });

    it('routes SessionProcessingError through the classifier when cause is OOM', () => {
      const err = new SessionProcessingError({
        cause: new Error('JavaScript heap out of memory'),
        stage: 'format',
        sessionId: 'session-A',
      });
      expect(describeExportError(err)).toMatch(/memory/i);
    });
  });

  describe('unknown error fallthrough', () => {
    it('falls through to a generic message for non-tagged errors', () => {
      const message = describeExportError(new Error('plain failure'));
      expect(message).toMatch(/export failed.*plain failure/i);
    });

    it('handles non-Error values', () => {
      expect(describeExportError('a string')).toMatch(/unexpected/i);
    });
  });
});
