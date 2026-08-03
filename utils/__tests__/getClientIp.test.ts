import { describe, expect, it, vi } from 'vitest';

const mockGet = vi.fn();
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  headers: vi.fn(() => Promise.resolve({ get: mockGet })),
}));

import { getClientIp } from '~/utils/getClientIp';

describe('getClientIp', () => {
  it('returns the cf-connecting-ip header value when present', async () => {
    mockGet.mockImplementation((header: string) => {
      if (header === 'cf-connecting-ip') return '1.2.3.4';
      return null;
    });

    const result = await getClientIp();
    expect(result).toBe('1.2.3.4');
  });

  it('returns the x-real-ip header value when cf-connecting-ip is absent', async () => {
    mockGet.mockImplementation((header: string) => {
      if (header === 'x-real-ip') return '5.6.7.8';
      return null;
    });

    const result = await getClientIp();
    expect(result).toBe('5.6.7.8');
  });

  it('returns the first IP from x-forwarded-for when cf-connecting-ip and x-real-ip are absent', async () => {
    mockGet.mockImplementation((header: string) => {
      if (header === 'x-forwarded-for') return '10.0.0.1, 10.0.0.2, 10.0.0.3';
      return null;
    });

    const result = await getClientIp();
    expect(result).toBe('10.0.0.1');
  });

  it('trims whitespace from the first IP in x-forwarded-for', async () => {
    mockGet.mockImplementation((header: string) => {
      if (header === 'x-forwarded-for') return '  192.168.1.1  , 192.168.1.2';
      return null;
    });

    const result = await getClientIp();
    expect(result).toBe('192.168.1.1');
  });

  it('returns null when no IP headers are present', async () => {
    mockGet.mockReturnValue(null);

    const result = await getClientIp();
    expect(result).toBeNull();
  });

  it('cf-connecting-ip takes priority over x-real-ip and x-forwarded-for', async () => {
    mockGet.mockImplementation((header: string) => {
      if (header === 'cf-connecting-ip') return '1.1.1.1';
      if (header === 'x-real-ip') return '2.2.2.2';
      if (header === 'x-forwarded-for') return '3.3.3.3, 4.4.4.4';
      return null;
    });

    const result = await getClientIp();
    expect(result).toBe('1.1.1.1');
  });

  it('x-real-ip takes priority over x-forwarded-for', async () => {
    mockGet.mockImplementation((header: string) => {
      if (header === 'x-real-ip') return '2.2.2.2';
      if (header === 'x-forwarded-for') return '3.3.3.3, 4.4.4.4';
      return null;
    });

    const result = await getClientIp();
    expect(result).toBe('2.2.2.2');
  });
});
