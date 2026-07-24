import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const {
  mockGetSignedUrl,
  mockGetS3PublicClient,
  mockGetS3Bucket,
  mockAssetFindUnique,
  mockProtocolFindFirst,
} = vi.hoisted(() => ({
  mockGetSignedUrl: vi.fn(),
  mockGetS3PublicClient: vi.fn(),
  mockGetS3Bucket: vi.fn(),
  mockAssetFindUnique: vi.fn(),
  mockProtocolFindFirst: vi.fn(),
}));

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: mockGetSignedUrl,
}));
vi.mock('~/lib/storage/layers/S3Client', () => ({
  getS3PublicClient: mockGetS3PublicClient,
  getS3Bucket: mockGetS3Bucket,
}));
vi.mock('~/lib/db', () => ({
  prisma: {
    asset: { findUnique: mockAssetFindUnique },
    protocol: { findFirst: mockProtocolFindFirst },
  },
}));

import { GET } from '~/app/api/assets/[key]/route';

const call = (key: string) =>
  GET(new Request(`http://localhost/api/assets/${key}`), {
    params: Promise.resolve({ key }),
  });

beforeEach(() => {
  vi.clearAllMocks();
  mockGetS3PublicClient.mockResolvedValue({});
  mockGetS3Bucket.mockResolvedValue('assets');
  mockGetSignedUrl.mockResolvedValue(
    'https://app.example.com/assets/abc.png?X-Amz-Signature=sig',
  );
  // Default: the requested key resolves to a known asset.
  mockAssetFindUnique.mockResolvedValue({ key: 'abc.png' });
  mockProtocolFindFirst.mockResolvedValue(null);
});

describe('GET /api/assets/[key]', () => {
  it('redirects to a presigned GET URL with cache + nosniff headers for a known asset', async () => {
    const response = await call('abc.png');

    expect(response.status).toBe(307);
    expect(response.headers.get('Location')).toBe(
      'https://app.example.com/assets/abc.png?X-Amz-Signature=sig',
    );
    expect(response.headers.get('Cache-Control')).toBe('private, max-age=3600');
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');

    expect(mockGetSignedUrl).toHaveBeenCalledOnce();
    expect(mockGetSignedUrl.mock.calls[0]?.[1]).toHaveProperty(
      'input',
      expect.objectContaining({
        Bucket: 'assets',
        Key: 'abc.png',
        ResponseContentDisposition: 'inline',
        ResponseContentType: 'image/png',
      }),
    );
  });

  it('forces attachment + a safe content type for script-capable assets (svg)', async () => {
    mockAssetFindUnique.mockResolvedValue({ key: 'x.svg' });

    await call('x.svg');

    expect(mockGetSignedUrl.mock.calls[0]?.[1]).toHaveProperty(
      'input',
      expect.objectContaining({
        ResponseContentDisposition: 'attachment',
        ResponseContentType: 'image/svg+xml',
      }),
    );
  });

  it('also serves a key referenced as a protocol original file', async () => {
    mockAssetFindUnique.mockResolvedValue(null);
    mockProtocolFindFirst.mockResolvedValue({ id: 'p1' });

    const response = await call('original.netcanvas');
    expect(response.status).toBe(307);
  });

  it('returns 404 for an unknown key (cannot sign arbitrary objects)', async () => {
    mockAssetFindUnique.mockResolvedValue(null);
    mockProtocolFindFirst.mockResolvedValue(null);

    const response = await call('unreferenced.png');
    expect(response.status).toBe(404);
    expect(mockGetSignedUrl).not.toHaveBeenCalled();
  });

  it('returns 400 for a malformed key without touching storage', async () => {
    const response = await GET(new Request('http://localhost/api/assets/x'), {
      params: Promise.resolve({ key: '../secret' }),
    });
    expect(response.status).toBe(400);
    expect(mockAssetFindUnique).not.toHaveBeenCalled();
  });

  it('returns 404 when signing fails', async () => {
    mockGetSignedUrl.mockRejectedValue(new Error('no config'));
    const response = await call('abc.png');
    expect(response.status).toBe(404);
  });
});
