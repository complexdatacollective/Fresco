import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockGetPreviewMode,
  mockGetAppSetting,
  mockGetServerSession,
  mockRequireApiTokenAuth,
} = vi.hoisted(() => ({
  mockGetPreviewMode: vi.fn(),
  mockGetAppSetting: vi.fn(),
  mockGetServerSession: vi.fn(),
  mockRequireApiTokenAuth: vi.fn(),
}));

vi.mock('~/queries/appSettings', () => ({
  getPreviewMode: mockGetPreviewMode,
  getAppSetting: mockGetAppSetting,
}));

vi.mock('~/utils/auth', () => ({
  getServerSession: mockGetServerSession,
}));

vi.mock('~/app/api/_helpers/auth', () => ({
  requireApiTokenAuth: mockRequireApiTokenAuth,
}));

import { checkPreviewAuth } from '../helpers';

describe('checkPreviewAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 403 when preview mode is disabled', async () => {
    mockGetPreviewMode.mockResolvedValue(false);

    const request = new NextRequest('http://localhost:3000/api/v1/preview');
    const result = await checkPreviewAuth(request);

    expect(result).not.toBeNull();
    expect(result!.status).toBe(403);
    expect(result!.response.message).toBe('Preview mode is not enabled');
  });

  it('should return null when preview mode is enabled and auth not required', async () => {
    mockGetPreviewMode.mockResolvedValue(true);
    mockGetAppSetting.mockResolvedValue(false);

    const request = new NextRequest('http://localhost:3000/api/v1/preview');
    const result = await checkPreviewAuth(request);

    expect(result).toBeNull();
  });

  it('should return null when auth required and session exists', async () => {
    mockGetPreviewMode.mockResolvedValue(true);
    mockGetAppSetting.mockResolvedValue(true);
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } });

    const request = new NextRequest('http://localhost:3000/api/v1/preview');
    const result = await checkPreviewAuth(request);

    expect(result).toBeNull();
    expect(mockRequireApiTokenAuth).not.toHaveBeenCalled();
  });

  it('should fall back to token auth when no session exists', async () => {
    mockGetPreviewMode.mockResolvedValue(true);
    mockGetAppSetting.mockResolvedValue(true);
    mockGetServerSession.mockResolvedValue(null);
    mockRequireApiTokenAuth.mockResolvedValue({ valid: true });

    const request = new NextRequest('http://localhost:3000/api/v1/preview', {
      headers: { Authorization: 'Bearer valid-token' },
    });
    const result = await checkPreviewAuth(request);

    expect(result).toBeNull();
    expect(mockRequireApiTokenAuth).toHaveBeenCalledWith(request);
  });

  it('should return 401 when no session and token auth fails', async () => {
    mockGetPreviewMode.mockResolvedValue(true);
    mockGetAppSetting.mockResolvedValue(true);
    mockGetServerSession.mockResolvedValue(null);
    mockRequireApiTokenAuth.mockResolvedValue({
      error: new Response(null, { status: 401 }),
    });

    const request = new NextRequest('http://localhost:3000/api/v1/preview');
    const result = await checkPreviewAuth(request);

    expect(result).not.toBeNull();
    expect(result!.status).toBe(401);
    expect(result!.response.message).toContain('Authentication required');
  });
});
