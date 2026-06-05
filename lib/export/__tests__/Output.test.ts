import { Readable } from 'node:stream';
import { Cause, Effect } from 'effect';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { unzipSync } from 'fflate';
import { Output } from '@codaco/network-exporters/services/Output';

// Hoisted mock state — available when vi.mock factories run (before imports).
const {
  mockUploadDone,
  capturedUploadParams,
  mockGetSignedUrl,
  mockGetS3Client,
  mockGetS3Bucket,
  mockGetUTApi,
  mockUploadFiles,
} = vi.hoisted(() => {
  const mockUploadDone = vi.fn<() => Promise<void>>();
  const capturedUploadParams: { value?: unknown } = {};
  const mockGetSignedUrl = vi.fn<() => Promise<string>>();
  const mockGetS3Client = vi.fn<() => Promise<object>>();
  const mockGetS3Bucket = vi.fn<() => Promise<string>>();
  const mockUploadFiles = vi.fn<
    (file: File) => Promise<{
      data: { key: string; ufsUrl: string } | null;
      error: Error | null;
    }>
  >();
  const mockGetUTApi = vi.fn<
    () => Promise<{ uploadFiles: typeof mockUploadFiles }>
  >();
  return {
    mockUploadDone,
    capturedUploadParams,
    mockGetSignedUrl,
    mockGetS3Client,
    mockGetS3Bucket,
    mockGetUTApi,
    mockUploadFiles,
  };
});

// Static mocks — hoisted before any imports, so the module graph never
// loads the real AWS SDK or Prisma (which can take 2–3 s on first load
// and cause the test to exceed its 5 s timeout).
vi.mock('@aws-sdk/client-s3', () => ({
  // These are only passed as opaque values to mocked functions (getSignedUrl,
  // Upload) that ignore them — no body is needed.
  GetObjectCommand: class {},
  PutObjectCommand: class {},
  DeleteObjectCommand: class {},
  S3Client: class {},
}));

vi.mock('@aws-sdk/lib-storage', () => ({
  Upload: vi.fn(function (
    this: { done: typeof mockUploadDone },
    input: { params: unknown },
  ) {
    capturedUploadParams.value = input.params;
    this.done = mockUploadDone;
  }),
}));

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: mockGetSignedUrl,
}));

vi.mock('~/lib/storage/layers/S3Client', () => ({
  getS3Client: mockGetS3Client,
  getS3Bucket: mockGetS3Bucket,
  getS3PublicBaseUrl: vi.fn(() => Promise.resolve('https://cdn.example')),
}));

vi.mock('~/lib/uploadthing/server-helpers', () => ({
  getUTApi: mockGetUTApi,
}));

vi.mock('~/lib/uploadthing/token', () => ({
  parseUploadThingToken: vi.fn(() => Promise.resolve(null)),
}));

import { makeProductionOutputLayer } from '~/lib/export/Output';

const utf8 = (s: string) => new TextEncoder().encode(s);

const writeTwoEntries = Effect.gen(function* () {
  const output = yield* Output;
  const handle = yield* output.begin();
  yield* output.writeEntry(handle, {
    name: 'a.txt',
    data: Readable.from([utf8('hello a')]),
  });
  yield* output.writeEntry(handle, {
    name: 'b.txt',
    data: Readable.from([utf8('hello b')]),
  });
  return yield* output.end(handle);
});

const decode = (buf: Uint8Array) => new TextDecoder().decode(buf);

describe('makeProductionOutputLayer (s3)', () => {
  describe('happy path', () => {
    beforeEach(() => {
      capturedUploadParams.value = undefined;
      mockUploadDone.mockResolvedValue(undefined);
      mockGetSignedUrl.mockResolvedValue('https://signed.example/test');
      mockGetS3Client.mockResolvedValue({});
      mockGetS3Bucket.mockResolvedValue('test-bucket');
    });

    it('streams the zip into S3 and returns a signed URL', async () => {
      const layer = makeProductionOutputLayer('s3');

      const result = await Effect.runPromise(
        writeTwoEntries.pipe(Effect.provide(layer)),
      );

      expect(result.key).toMatch(/\.zip$/);
      expect(result.url).toBe('https://signed.example/test');

      if (
        !capturedUploadParams.value ||
        typeof capturedUploadParams.value !== 'object' ||
        !('Bucket' in capturedUploadParams.value)
      ) {
        throw new Error('expected captured S3 Upload params');
      }
      const { Bucket, Key, ContentType, Body } = capturedUploadParams.value as {
        Bucket: string;
        Key: string;
        ContentType: string;
        Body: NodeJS.ReadableStream;
      };
      expect(Bucket).toBe('test-bucket');
      expect(ContentType).toBe('application/zip');
      expect(Key).toBe(result.key);

      // Consume the captured Body and assert it's a real zip with our entries.
      const chunks: Buffer[] = [];
      for await (const chunk of Body) {
        chunks.push(Buffer.from(chunk));
      }
      const zipBytes = Buffer.concat(chunks);
      const entries = unzipSync(new Uint8Array(zipBytes));
      expect(decode(entries['a.txt']!)).toBe('hello a');
      expect(decode(entries['b.txt']!)).toBe('hello b');
    });
  });

  describe('error path', () => {
    beforeEach(() => {
      mockUploadDone.mockRejectedValue(new Error('s3 boom'));
      mockGetS3Client.mockResolvedValue({});
      mockGetS3Bucket.mockResolvedValue('test-bucket');
    });

    afterEach(() => {
      mockUploadDone.mockReset();
    });

    it('maps S3 upload failures to OutputError', async () => {
      const exit = await Effect.runPromiseExit(
        writeTwoEntries.pipe(Effect.provide(makeProductionOutputLayer('s3'))),
      );
      expect(exit._tag).toBe('Failure');
      if (exit._tag !== 'Failure') return;
      const opt = Cause.failureOption(exit.cause);
      expect(opt._tag).toBe('Some');
      if (opt._tag !== 'Some') return;
      expect(opt.value._tag).toBe('NetworkExporters/OutputError');
      expect(opt.value.cause).toBeInstanceOf(Error);
      expect((opt.value.cause as Error).message).toContain('s3 boom');
    });
  });
});

describe('makeProductionOutputLayer (uploadthing)', () => {
  describe('happy path', () => {
    let capturedFile: File | undefined;

    beforeEach(() => {
      capturedFile = undefined;
      mockUploadFiles.mockImplementation((file: File) => {
        capturedFile = file;
        return Promise.resolve({
          data: {
            key: 'utkey-abc',
            ufsUrl: 'https://TEST.ufs.sh/f/utkey-abc',
          },
          error: null,
        });
      });
      mockGetUTApi.mockResolvedValue({ uploadFiles: mockUploadFiles });
    });

    it('uploads the zip as a File and returns the ufsUrl', async () => {
      const { makeProductionOutputLayer: freshMakeLayer } =
        await import('~/lib/export/Output');
      const result = await Effect.runPromise(
        writeTwoEntries.pipe(
          Effect.provide(freshMakeLayer('uploadthing')),
        ),
      );
      expect(result).toEqual({
        key: 'utkey-abc',
        url: 'https://TEST.ufs.sh/f/utkey-abc',
      });
      expect(mockUploadFiles).toHaveBeenCalledTimes(1);
      if (!capturedFile) throw new Error('no file captured');
      expect(capturedFile.name).toMatch(/\.zip$/);
      const buf = new Uint8Array(await capturedFile.arrayBuffer());
      const entries = unzipSync(buf);
      expect(decode(entries['a.txt']!)).toBe('hello a');
      expect(decode(entries['b.txt']!)).toBe('hello b');
    });
  });

  describe('error path', () => {
    beforeEach(() => {
      mockGetUTApi.mockRejectedValue(new Error('ut boom'));
    });

    afterEach(() => {
      mockGetUTApi.mockReset();
    });

    it('maps UploadThing failures to OutputError', async () => {
      const exit = await Effect.runPromiseExit(
        writeTwoEntries.pipe(
          Effect.provide(makeProductionOutputLayer('uploadthing')),
        ),
      );
      expect(exit._tag).toBe('Failure');
      if (exit._tag !== 'Failure') return;
      const opt = Cause.failureOption(exit.cause);
      expect(opt._tag).toBe('Some');
      if (opt._tag !== 'Some') return;
      expect(opt.value._tag).toBe('NetworkExporters/OutputError');
      expect(opt.value.cause).toBeInstanceOf(Error);
      expect((opt.value.cause as Error).message).toContain('ut boom');
    });
  });
});
