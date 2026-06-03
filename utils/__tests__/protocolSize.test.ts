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

  it('rejects a file just over the limit and rounds its size up', () => {
    const error = getProtocolSizeError({ size: 256 * 1024 * 1024 + 1 });
    // Math.ceil avoids displaying an over-limit file as exactly "256 MB".
    expect(error).toContain('257');
  });

  it('phrases the limit inclusively to match the <= check', () => {
    const error = getProtocolSizeError({ size: 300 * 1024 * 1024 });
    expect(error).toContain('256 MB or smaller');
  });
});
