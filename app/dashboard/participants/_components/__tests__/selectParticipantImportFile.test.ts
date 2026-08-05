import { describe, expect, it } from 'vitest';

import selectParticipantImportFile from '../selectParticipantImportFile';

describe('selectParticipantImportFile', () => {
  const file = new File(['identifier,label'], 'participants.csv', {
    type: 'text/csv',
  });

  it('returns the only accepted file when there are no rejections', () => {
    expect(selectParticipantImportFile([file], [])).toBe(file);
  });

  it('rejects a drop with no accepted files', () => {
    expect(selectParticipantImportFile([], [{ file }])).toBeNull();
  });

  it('rejects a drop with multiple accepted files', () => {
    const secondFile = new File(['identifier'], 'other.csv', {
      type: 'text/csv',
    });

    expect(selectParticipantImportFile([file, secondFile], [])).toBeNull();
  });

  it('rejects the whole drop when react-dropzone accepts one file and rejects the surplus', () => {
    expect(selectParticipantImportFile([file], [{ file }])).toBeNull();
  });
});
