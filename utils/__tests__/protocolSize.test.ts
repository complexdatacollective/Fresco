import { describe, expect, it } from 'vitest';
import { getProtocolSizeError } from '~/utils/protocolSize';

describe('getProtocolSizeError', () => {
  it('returns null for a file at the limit', () => {
    expect(getProtocolSizeError({ size: 256 * 1024 * 1024 })).toBeNull();
  });

  it('returns null for a small file', () => {
    expect(getProtocolSizeError({ size: 1024 })).toBeNull();
  });

  it('returns a message for an oversized file', () => {
    const error = getProtocolSizeError({
      size: 300 * 1024 * 1024,
    });
    expect(error).toContain('300');
    expect(error).toContain('256');
  });
});
