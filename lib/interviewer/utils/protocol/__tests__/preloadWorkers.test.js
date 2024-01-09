/* eslint-env jest */

import * as workerAgentHelpers from '../../WorkerAgent';
import { readFile } from '../../filesystem';
import preloadWorkers from '../preloadWorkers';

jest.mock('../../filesystem');

const mockUrl = 'blob:file://script.js';

global.TextDecoder = class TextDecoder {
  decode = jest.fn().mockReturnValue('');
};

describe('preloadWorkers', () => {
  describe('when script exists', () => {
    beforeAll(() => {
      readFile.mockReturnValue(Promise.resolve('function myWorker() {}'));
      workerAgentHelpers.urlForWorkerSource = jest
        .fn()
        .mockReturnValue(mockUrl);
    });

    it('returns a promise', () => {
      expect(preloadWorkers('development', false)).toBeInstanceOf(Promise);
    });

    it('resolves to an array of URLs', async () => {
      const promise = preloadWorkers('development', false);
      await expect(promise).resolves.toBeInstanceOf(Array);
      await expect(promise).resolves.toContainEqual(
        expect.stringMatching(mockUrl),
      );
    });
  });

  describe('when script doesn’t exist', () => {
    beforeAll(() => {
      readFile.mockRejectedValue(new Error('ENOENT'));
    });

    it('resolves to null URLs', async () => {
      const promise = preloadWorkers('development', false);
      await expect(promise).resolves.toBeInstanceOf(Array);
      await expect(promise).resolves.toContain(null);
    });
  });
});
