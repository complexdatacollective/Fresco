import { describe, expect, it } from 'vitest';
import { isSafeHttpUrl } from '../safeUrl';

describe('isSafeHttpUrl', () => {
  it('allows public http(s) hosts and container hostnames', () => {
    expect(isSafeHttpUrl('https://s3.amazonaws.com')).toBe(true);
    expect(isSafeHttpUrl('http://minio:9000')).toBe(true);
    expect(isSafeHttpUrl('https://storage.example.com/bucket')).toBe(true);
    expect(isSafeHttpUrl('http://203.0.113.10')).toBe(true);
  });

  it('rejects loopback, private, and link-local IP literals (SSRF)', () => {
    expect(isSafeHttpUrl('http://127.0.0.1')).toBe(false);
    expect(isSafeHttpUrl('http://0.0.0.0')).toBe(false);
    expect(isSafeHttpUrl('http://10.0.0.5:9000')).toBe(false);
    expect(isSafeHttpUrl('http://172.16.0.1')).toBe(false);
    expect(isSafeHttpUrl('http://192.168.1.1')).toBe(false);
    // Cloud metadata endpoint — the canonical SSRF target.
    expect(isSafeHttpUrl('http://169.254.169.254')).toBe(false);
    expect(isSafeHttpUrl('http://[::1]:9000')).toBe(false);
  });

  it('rejects non-http(s) schemes and malformed input', () => {
    expect(isSafeHttpUrl('file:///etc/passwd')).toBe(false);
    expect(isSafeHttpUrl('ftp://example.com')).toBe(false);
    expect(isSafeHttpUrl('not a url')).toBe(false);
    expect(isSafeHttpUrl('')).toBe(false);
  });
});
