import { Readable } from 'node:stream';
import { Cause, Effect } from 'effect';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { unzipSync } from 'fflate';
import { Output } from '@codaco/network-exporters/services/Output';

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
    const captured: { params?: unknown } = {};

    beforeEach(() => {
      vi.resetModules();
      captured.params = undefined;

      vi.doMock('@aws-sdk/lib-storage', () => ({
        Upload: class {
          constructor(input: { params: unknown }) {
            captured.params = input.params;
          }
          done() {
            return Promise.resolve();
          }
        },
      }));
      vi.doMock('@aws-sdk/s3-request-presigner', () => ({
        getSignedUrl: () => Promise.resolve('https://signed.example/test'),
      }));
      vi.doMock('~/lib/storage/layers/S3Client', () => ({
        getS3Client: () => Promise.resolve({}),
        getS3Bucket: () => Promise.resolve('test-bucket'),
        getS3PublicBaseUrl: () => Promise.resolve('https://cdn.example'),
      }));
    });

    afterEach(() => {
      vi.resetModules();
    });

    it('streams the zip into S3 and returns a signed URL', async () => {
      // Re-import after mocks are in place
      const { makeProductionOutputLayer } = await import('~/lib/export/Output');
      const layer = makeProductionOutputLayer('s3');

      const result = await Effect.runPromise(
        writeTwoEntries.pipe(Effect.provide(layer)),
      );

      expect(result.key).toMatch(/\.zip$/);
      expect(result.url).toBe('https://signed.example/test');

      if (
        !captured.params ||
        typeof captured.params !== 'object' ||
        !('Bucket' in captured.params)
      ) {
        throw new Error('expected captured S3 Upload params');
      }
      const { Bucket, Key, ContentType, Body } = captured.params as {
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
      vi.resetModules();

      vi.doMock('@aws-sdk/lib-storage', () => ({
        Upload: class {
          done() {
            return Promise.reject(new Error('s3 boom'));
          }
        },
      }));
      vi.doMock('@aws-sdk/s3-request-presigner', () => ({
        getSignedUrl: () => Promise.resolve('https://signed.example/test'),
      }));
      vi.doMock('~/lib/storage/layers/S3Client', () => ({
        getS3Client: () => Promise.resolve({}),
        getS3Bucket: () => Promise.resolve('test-bucket'),
        getS3PublicBaseUrl: () => Promise.resolve('https://cdn.example'),
      }));
    });

    afterEach(() => {
      vi.resetModules();
    });

    it('maps S3 upload failures to OutputError', async () => {
      const { makeProductionOutputLayer } = await import('~/lib/export/Output');
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
    let uploadFiles: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      vi.resetModules();
      capturedFile = undefined;
      uploadFiles = vi.fn((file: File) => {
        capturedFile = file;
        return Promise.resolve({
          data: {
            key: 'utkey-abc',
            ufsUrl: 'https://TEST.ufs.sh/f/utkey-abc',
          },
          error: null,
        });
      });
      vi.doMock('~/lib/uploadthing/server-helpers', () => ({
        getUTApi: () => Promise.resolve({ uploadFiles }),
      }));
      vi.doMock('~/lib/uploadthing/token', () => ({
        parseUploadThingToken: () => Promise.resolve({ appId: 'TEST' }),
      }));
    });

    afterEach(() => {
      vi.resetModules();
    });

    it('uploads the zip as a File and returns the ufsUrl', async () => {
      const { makeProductionOutputLayer } = await import('~/lib/export/Output');
      const result = await Effect.runPromise(
        writeTwoEntries.pipe(
          Effect.provide(makeProductionOutputLayer('uploadthing')),
        ),
      );
      expect(result).toEqual({
        key: 'utkey-abc',
        url: 'https://TEST.ufs.sh/f/utkey-abc',
      });
      expect(uploadFiles).toHaveBeenCalledTimes(1);
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
      vi.resetModules();
      vi.doMock('~/lib/uploadthing/server-helpers', () => ({
        getUTApi: () => Promise.reject(new Error('ut boom')),
      }));
      vi.doMock('~/lib/uploadthing/token', () => ({
        parseUploadThingToken: () => Promise.resolve({ appId: 'TEST' }),
      }));
    });

    afterEach(() => {
      vi.resetModules();
    });

    it('maps UploadThing failures to OutputError', async () => {
      const { makeProductionOutputLayer } = await import('~/lib/export/Output');
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
