import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockVerifyApiToken } = vi.hoisted(() => ({
  mockVerifyApiToken: vi.fn(),
}));

vi.mock('~/actions/apiTokens', () => ({
  verifyApiToken: mockVerifyApiToken,
}));

import { createCorsHeaders, requireApiTokenAuth } from '../auth';

describe('API auth helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createCorsHeaders', () => {
    it('should return headers with specified methods', () => {
      const headers = createCorsHeaders('GET, POST');

      expect(headers['Access-Control-Allow-Origin']).toBe('*');
      expect(headers['Access-Control-Allow-Methods']).toBe('GET, POST');
      expect(headers['Access-Control-Allow-Headers']).toBe(
        'Content-Type, Authorization',
      );
    });
  });

  describe('requireApiTokenAuth', () => {
    it('should return error when no authorization header is present', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/test');

      const result = await requireApiTokenAuth(request);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toBeInstanceOf(NextResponse);
        const body = (await result.error.json()) as { error: string };
        expect(body.error).toContain('Authentication required');
      }
    });

    it('should return error when token is invalid', async () => {
      mockVerifyApiToken.mockResolvedValue({ valid: false });

      const request = new NextRequest('http://localhost:3000/api/v1/test', {
        headers: { Authorization: 'Bearer invalid-token' },
      });

      const result = await requireApiTokenAuth(request);

      expect('error' in result).toBe(true);
      expect(mockVerifyApiToken).toHaveBeenCalledWith('invalid-token');
    });

    it('should return valid when token is valid', async () => {
      mockVerifyApiToken.mockResolvedValue({ valid: true });

      const request = new NextRequest('http://localhost:3000/api/v1/test', {
        headers: { Authorization: 'Bearer valid-token' },
      });

      const result = await requireApiTokenAuth(request);

      expect(result).toEqual({ valid: true });
      expect(mockVerifyApiToken).toHaveBeenCalledWith('valid-token');
    });

    it('should extract token from Bearer prefix', async () => {
      mockVerifyApiToken.mockResolvedValue({ valid: true });

      const request = new NextRequest('http://localhost:3000/api/v1/test', {
        headers: { Authorization: 'Bearer my-secret-token' },
      });

      await requireApiTokenAuth(request);

      expect(mockVerifyApiToken).toHaveBeenCalledWith('my-secret-token');
    });
  });
});
