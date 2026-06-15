import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const { mockGetSignedUrl, mockGetS3PublicClient, mockGetS3Bucket } = vi.hoisted(
  () => ({
    mockGetSignedUrl: vi.fn(),
    mockGetS3PublicClient: vi.fn(),
    mockGetS3Bucket: vi.fn(),
  }),
);

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: mockGetSignedUrl,
}));
vi.mock('~/lib/storage/layers/S3Client', () => ({
  getS3PublicClient: mockGetS3PublicClient,
  getS3Bucket: mockGetS3Bucket,
}));

import { GET } from '~/app/api/assets/[key]/route';

beforeEach(() => {
  vi.clearAllMocks();
  mockGetS3PublicClient.mockResolvedValue({});
  mockGetS3Bucket.mockResolvedValue('assets');
  mockGetSignedUrl.mockResolvedValue(
    'https://app.example.com/assets/abc.png?X-Amz-Signature=sig',
  );
});

describe('GET /api/assets/[key]', () => {
  it('redirects to a presigned GET URL with cache headers', async () => {
    const response = await GET(
      new Request('http://localhost/api/assets/abc.png'),
      {
        params: Promise.resolve({ key: 'abc.png' }),
      },
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('Location')).toBe(
      'https://app.example.com/assets/abc.png?X-Amz-Signature=sig',
    );
    expect(response.headers.get('Cache-Control')).toBe('private, max-age=3600');

    expect(mockGetSignedUrl).toHaveBeenCalledOnce();
    expect(mockGetSignedUrl.mock.calls[0]?.[1]).toHaveProperty(
      'input',
      expect.objectContaining({ Bucket: 'assets', Key: 'abc.png' }),
    );
  });

  it('returns 404 when signing fails', async () => {
    mockGetSignedUrl.mockRejectedValue(new Error('no config'));
    const response = await GET(
      new Request('http://localhost/api/assets/abc.png'),
      {
        params: Promise.resolve({ key: 'abc.png' }),
      },
    );
    expect(response.status).toBe(404);
  });
});
