import type * as PostHogNode from 'posthog-node';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockCapture,
  mockCaptureException,
  mockFlush,
  mockGetDisableAnalytics,
  mockGetInstallationId,
  mockHeaders,
  mockFindUnique,
  mockEnv,
} = vi.hoisted(() => ({
  mockCapture: vi.fn(),
  mockCaptureException: vi.fn(),
  mockFlush: vi.fn().mockResolvedValue(undefined),
  mockGetDisableAnalytics: vi.fn(),
  mockGetInstallationId: vi.fn(),
  mockHeaders: vi.fn(),
  mockFindUnique: vi.fn(),
  mockEnv: {} as { INSTALLATION_ID?: string; DISABLE_ANALYTICS?: boolean },
}));

vi.mock('posthog-node', () => {
  const MockPostHog = vi.fn(function (this: Record<string, unknown>) {
    this.capture = mockCapture;
    this.captureException = mockCaptureException;
    this.flush = mockFlush;
  });
  return { PostHog: MockPostHog };
});

vi.mock('~/queries/appSettings', () => ({
  getDisableAnalytics: mockGetDisableAnalytics,
  getInstallationId: mockGetInstallationId,
}));

vi.mock('next/headers', () => ({
  headers: mockHeaders,
}));

vi.mock('~/env', () => ({
  env: mockEnv,
}));

vi.mock('~/lib/db', () => ({
  prisma: { appSettings: { findUnique: mockFindUnique } },
}));

vi.mock('~/fresco.config', () => ({
  POSTHOG_API_KEY: 'test-api-key',
  POSTHOG_APP_PROPERTIES: {
    app: 'Fresco',
    $app_name: 'Fresco',
    host_version: '4.1.1',
    $app_version: '4.1.1',
  },
  POSTHOG_PROXY_HOST: 'https://test.example.com',
}));

describe('posthog-server', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockHeaders.mockResolvedValue(new Headers());
    mockEnv.INSTALLATION_ID = 'install-123';
    delete mockEnv.DISABLE_ANALYTICS;
    mockFindUnique.mockResolvedValue(null);
  });

  describe('getPostHogServer', () => {
    it('constructs the client without exception autocapture', async () => {
      const { PostHog } = await import('posthog-node');
      const { getPostHogServer } = await import('../posthog-server');

      getPostHogServer();

      expect(PostHog).toHaveBeenCalledWith('test-api-key', {
        host: 'https://test.example.com',
        flushAt: 1,
        flushInterval: 0,
        before_send: expect.any(Function),
      });
    });

    // The consent leak this guards against is not visible in the options
    // object alone: `enableExceptionAutocapture` makes posthog-node attach
    // process-level listeners that report exceptions without checking the
    // deployment's setting, and nothing removes them afterwards. So take the
    // options this module actually passes and hand them to the real library,
    // which is the only thing that can say whether they install listeners.
    it('installs no process-level exception listeners', async () => {
      const { PostHog: MockedPostHog } = await import('posthog-node');
      const { getPostHogServer } = await import('../posthog-server');

      getPostHogServer();

      const constructorArgs = vi.mocked(MockedPostHog).mock.calls[0];
      if (!constructorArgs) {
        throw new Error('The module did not construct a PostHog client.');
      }

      const { PostHog: RealPostHog } =
        await vi.importActual<typeof PostHogNode>('posthog-node');

      const before = {
        uncaughtException: process.listenerCount('uncaughtException'),
        unhandledRejection: process.listenerCount('unhandledRejection'),
      };

      const realClient = new RealPostHog(...constructorArgs);

      try {
        expect({
          uncaughtException: process.listenerCount('uncaughtException'),
          unhandledRejection: process.listenerCount('unhandledRejection'),
        }).toEqual(before);
      } finally {
        await realClient.shutdown();
      }
    });
  });

  describe('before_send exception mechanism', () => {
    async function getBeforeSend() {
      const { PostHog } = await import('posthog-node');
      const { getPostHogServer } = await import('../posthog-server');

      getPostHogServer();

      const options = vi.mocked(PostHog).mock.calls[0]?.[1];
      const beforeSend = options?.before_send;

      if (typeof beforeSend !== 'function') {
        throw new Error('The client was constructed without a before_send.');
      }

      return beforeSend;
    }

    it('moves the marker into the exception and removes it', async () => {
      const beforeSend = await getBeforeSend();

      const result = beforeSend({
        event: '$exception',
        distinctId: 'install-123',
        properties: {
          fresco_exception_mechanism: 'onunhandledrejection',
          $exception_list: [
            {
              type: 'TypeError',
              value: 'boom',
              mechanism: { type: 'generic', handled: true, synthetic: false },
            },
          ],
          installation_id: 'install-123',
        },
      });

      expect(result?.properties).toEqual({
        installation_id: 'install-123',
        $exception_list: [
          {
            type: 'TypeError',
            value: 'boom',
            mechanism: {
              type: 'onunhandledrejection',
              handled: false,
              synthetic: false,
            },
          },
        ],
      });
    });

    // ErrorPropertiesBuilder walks an error's `cause` into further entries and
    // marks those handled, and stamps each entry with its own `synthetic`.
    // Autocapture kept both; overwriting the whole mechanism would report one
    // cause chain as several separate unhandled failures.
    it('marks only the first entry unhandled and keeps synthetic', async () => {
      const beforeSend = await getBeforeSend();

      const result = beforeSend({
        event: '$exception',
        distinctId: 'install-123',
        properties: {
          fresco_exception_mechanism: 'onuncaughtexception',
          $exception_list: [
            {
              type: 'Error',
              value: 'outer',
              mechanism: { type: 'generic', handled: true, synthetic: false },
            },
            {
              type: 'Error',
              value: 'the cause',
              mechanism: { type: 'generic', handled: true, synthetic: true },
            },
          ],
        },
      });

      expect(result?.properties?.$exception_list).toEqual([
        {
          type: 'Error',
          value: 'outer',
          mechanism: {
            type: 'onuncaughtexception',
            handled: false,
            synthetic: false,
          },
        },
        {
          type: 'Error',
          value: 'the cause',
          mechanism: {
            type: 'onuncaughtexception',
            handled: true,
            synthetic: true,
          },
        },
      ]);
    });

    it('leaves an ordinary event untouched', async () => {
      const beforeSend = await getBeforeSend();

      const event = {
        event: 'ProtocolInstalled',
        distinctId: 'install-123',
        properties: { installation_id: 'install-123' },
      };

      expect(beforeSend(event)).toEqual(event);
    });

    it('strips the marker even when there is no exception list', async () => {
      const beforeSend = await getBeforeSend();

      const result = beforeSend({
        event: '$exception',
        distinctId: 'install-123',
        properties: { fresco_exception_mechanism: 'onuncaughtexception' },
      });

      expect(result?.properties).toEqual({});
    });

    it('passes a dropped event through', async () => {
      const beforeSend = await getBeforeSend();

      expect(beforeSend(null)).toBeNull();
    });
  });

  describe('installProcessErrorReporting', () => {
    // The listeners are invoked directly rather than through `process.emit`,
    // so the test never provokes the runner's own process-level handlers.
    // Each event is looked up separately, so the listeners keep the argument
    // types Node gives them.
    const addedUncaught: NodeJS.UncaughtExceptionListener[] = [];
    const addedRejection: NodeJS.UnhandledRejectionListener[] = [];

    async function installAndGetListeners() {
      const uncaughtBefore = process.listeners('uncaughtException');
      const rejectionBefore = process.listeners('unhandledRejection');

      const { installProcessErrorReporting } =
        await import('../posthog-server');
      installProcessErrorReporting();

      const onUncaught = process
        .listeners('uncaughtException')
        .find((listener) => !uncaughtBefore.includes(listener));
      const onRejection = process
        .listeners('unhandledRejection')
        .find((listener) => !rejectionBefore.includes(listener));

      if (!onUncaught || !onRejection) {
        throw new Error('Process error listeners were not installed.');
      }

      addedUncaught.push(onUncaught);
      addedRejection.push(onRejection);

      return {
        reportUncaught: (error: Error) =>
          onUncaught(error, 'uncaughtException'),
        reportRejection: (reason: unknown) =>
          onRejection(
            reason,
            Promise.reject(reason).catch(() => undefined),
          ),
      };
    }

    // Reporting is asynchronous — the listener hands off and returns — so give
    // the settings read and the capture a chance to run before asserting.
    const settle = async () => {
      for (let tick = 0; tick < 5; tick += 1) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    };

    afterEach(() => {
      for (const listener of addedUncaught.splice(0)) {
        process.removeListener('uncaughtException', listener);
      }
      for (const listener of addedRejection.splice(0)) {
        process.removeListener('unhandledRejection', listener);
      }
    });

    it('reports an unhandled rejection', async () => {
      const { reportRejection } = await installAndGetListeners();
      const reason = new Error('nobody awaited this');

      reportRejection(reason);
      await settle();

      expect(mockCaptureException).toHaveBeenCalledWith(
        reason,
        'install-123',
        expect.objectContaining({
          $source: 'server',
          installation_id: 'install-123',
        }),
      );
      expect(mockFlush).toHaveBeenCalled();
    });

    it('reports an uncaught exception', async () => {
      const { reportUncaught } = await installAndGetListeners();
      const error = new Error('thrown on a timer');

      reportUncaught(error);
      await settle();

      expect(mockCaptureException).toHaveBeenCalledWith(
        error,
        'install-123',
        expect.objectContaining({
          fresco_exception_mechanism: 'onuncaughtexception',
        }),
      );
    });

    // The property posthog-node's own autocapture could not provide: the same
    // installed listeners stop reporting the moment the researcher turns
    // analytics off, without being torn down or replaced.
    it('re-reads the setting on every event, so turning analytics off takes effect', async () => {
      const { reportRejection } = await installAndGetListeners();

      reportRejection(new Error('while analytics were on'));
      await settle();
      expect(mockCaptureException).toHaveBeenCalledTimes(1);

      mockFindUnique.mockResolvedValue({
        key: 'disableAnalytics',
        value: 'true',
      });

      reportRejection(new Error('after analytics were turned off'));
      await settle();
      expect(mockCaptureException).toHaveBeenCalledTimes(1);
    });

    it('sends nothing when DISABLE_ANALYTICS is set', async () => {
      mockEnv.DISABLE_ANALYTICS = true;
      const { reportRejection } = await installAndGetListeners();

      reportRejection(new Error('boom'));
      await settle();

      expect(mockCaptureException).not.toHaveBeenCalled();
    });

    it('stays silent when the setting cannot be read', async () => {
      mockFindUnique.mockRejectedValue(new Error('database is down'));
      const { reportRejection } = await installAndGetListeners();

      reportRejection(new Error('boom'));
      await settle();

      expect(mockFindUnique).toHaveBeenCalled();
      expect(mockCaptureException).not.toHaveBeenCalled();
    });

    // One broken interval can reject forever, and every report costs a
    // settings read as well as a request to the relay.
    it('caps a flood of repeats', async () => {
      const { reportRejection } = await installAndGetListeners();

      // Reported one at a time, so the assertion is about the budget rather
      // than about how much of a burst happens to have drained.
      for (let index = 0; index < 15; index += 1) {
        reportRejection(new Error(`repeat ${index}`));
        await settle();
      }

      expect(mockCaptureException).toHaveBeenCalledTimes(10);
    });

    // A single process-wide bucket would let a noisy repeat hide the arrival
    // of a new and different failure for the rest of the window.
    it('keeps capacity for a different failure while one kind floods', async () => {
      const { reportRejection } = await installAndGetListeners();

      class NoisyError extends Error {
        override name = 'NoisyError';
      }
      class RareError extends Error {
        override name = 'RareError';
      }

      for (let index = 0; index < 15; index += 1) {
        reportRejection(new NoisyError(`repeat ${index}`));
        await settle();
      }
      expect(mockCaptureException).toHaveBeenCalledTimes(10);

      const rare = new RareError('the one that matters');
      reportRejection(rare);
      await settle();

      expect(mockCaptureException).toHaveBeenCalledWith(
        rare,
        'install-123',
        expect.anything(),
      );
    });

    // The two mechanisms must not share a bucket either.
    it('keeps capacity for uncaught exceptions while rejections flood', async () => {
      const { reportRejection, reportUncaught } =
        await installAndGetListeners();

      for (let index = 0; index < 15; index += 1) {
        reportRejection(new Error(`repeat ${index}`));
        await settle();
      }

      const thrown = new Error('a real throw');
      reportUncaught(thrown);
      await settle();

      expect(mockCaptureException).toHaveBeenCalledWith(
        thrown,
        'install-123',
        expect.anything(),
      );
    });

    // Whatever was rejected reaches the listener as-is. Classification runs
    // before the reporting path's own guard, so a throw here would lose the
    // report — and from the uncaughtException listener, end the process.
    // These assert on call counts rather than on the reported value itself:
    // handing a revoked proxy or a throwing `name` to a matcher makes the
    // matcher throw, which would hide what is being tested.
    it('reports a value that throws on instanceof', async () => {
      const { reportRejection } = await installAndGetListeners();

      const revocable = Proxy.revocable({}, {});
      revocable.revoke();

      expect(() => reportRejection(revocable.proxy)).not.toThrow();
      await settle();

      expect(mockCaptureException).toHaveBeenCalledTimes(1);
      expect(mockCaptureException.mock.calls[0]?.[1]).toBe('install-123');
    });

    it('reports an error whose name accessor throws', async () => {
      const { reportUncaught } = await installAndGetListeners();

      const hostile = new Error('boom');
      Object.defineProperty(hostile, 'name', {
        get() {
          throw new Error('name is a trap');
        },
      });

      expect(() => reportUncaught(hostile)).not.toThrow();
      await settle();

      expect(mockCaptureException).toHaveBeenCalledTimes(1);
      expect(mockCaptureException.mock.calls[0]?.[2]).toMatchObject({
        fresco_exception_mechanism: 'onuncaughtexception',
      });
    });

    // The per-kind buckets are bounded, so that code throwing many
    // differently-named errors cannot grow the map without limit. Eviction is
    // least-recently-used, and an evicted kind starts from a full bucket.
    it('bounds how many failure kinds it tracks', async () => {
      const { reportRejection } = await installAndGetListeners();

      const named = (name: string) => {
        const error = new Error(`from ${name}`);
        error.name = name;
        return error;
      };

      // Exhaust one kind. The budget is spent synchronously in the listener,
      // so these do not need to finish reporting to count.
      for (let index = 0; index < 12; index += 1) {
        reportRejection(named('FloodError'));
      }
      await settle();
      mockCaptureException.mockClear();

      // Push it out of the map with more distinct kinds than the cap.
      for (let index = 0; index < 50; index += 1) {
        reportRejection(named(`Distinct${index}Error`));
      }
      await settle();
      mockCaptureException.mockClear();

      // Evicted, so this starts from a full bucket rather than staying limited.
      const returning = named('FloodError');
      reportRejection(returning);
      await settle();

      expect(mockCaptureException).toHaveBeenCalledWith(
        returning,
        'install-123',
        expect.anything(),
      );
    });

    // posthog-node's public captureException has no parameter for the
    // mechanism, so the marker travels as a property and before_send moves it
    // into the exception. Without that, error tracking records a genuinely
    // unhandled failure as handled.
    it('tags reports so before_send can mark them unhandled', async () => {
      const { reportRejection } = await installAndGetListeners();

      reportRejection(new Error('nobody awaited this'));
      await settle();

      expect(mockCaptureException).toHaveBeenCalledWith(
        expect.anything(),
        'install-123',
        expect.objectContaining({
          fresco_exception_mechanism: 'onunhandledrejection',
        }),
      );
    });

    it('installs its listeners only once', async () => {
      const before = process.listeners('unhandledRejection');
      const { installProcessErrorReporting } =
        await import('../posthog-server');

      installProcessErrorReporting();
      installProcessErrorReporting();
      installProcessErrorReporting();

      const added = process
        .listeners('unhandledRejection')
        .filter((listener) => !before.includes(listener));
      addedRejection.push(...added);
      addedUncaught.push(...process.listeners('uncaughtException').slice(-1));

      expect(added).toHaveLength(1);
    });
  });

  describe('captureEvent', () => {
    it('returns early when analytics disabled', async () => {
      mockGetDisableAnalytics.mockResolvedValue(true);

      const { captureEvent } = await import('../posthog-server');
      await captureEvent('test-event', { key: 'value' });

      expect(mockGetDisableAnalytics).toHaveBeenCalled();
      expect(mockGetInstallationId).not.toHaveBeenCalled();
      expect(mockCapture).not.toHaveBeenCalled();
    });

    it('calls capture with correct args when analytics enabled', async () => {
      mockGetDisableAnalytics.mockResolvedValue(false);
      mockGetInstallationId.mockResolvedValue('install-123');

      const { captureEvent } = await import('../posthog-server');
      await captureEvent('test-event', { key: 'value' });

      expect(mockCapture).toHaveBeenCalledWith({
        distinctId: 'install-123',
        event: 'test-event',
        properties: {
          app: 'Fresco',
          $app_name: 'Fresco',
          host_version: '4.1.1',
          $app_version: '4.1.1',
          installation_id: 'install-123',
          key: 'value',
          $source: 'server',
        },
      });
    });

    it('adds the browser session ID to server events', async () => {
      mockGetDisableAnalytics.mockResolvedValue(false);
      mockGetInstallationId.mockResolvedValue('install-123');
      mockHeaders.mockResolvedValue(
        new Headers({ 'x-posthog-session-id': 'browser-session-123' }),
      );

      const { captureEvent } = await import('../posthog-server');
      await captureEvent('test-event');

      expect(mockCapture).toHaveBeenCalledWith(
        expect.objectContaining({
          distinctId: 'install-123',
          properties: expect.objectContaining({
            $session_id: 'browser-session-123',
          }),
        }),
      );
    });

    it('still captures outside a browser request context', async () => {
      mockGetDisableAnalytics.mockResolvedValue(false);
      mockGetInstallationId.mockResolvedValue('install-123');
      mockHeaders.mockRejectedValue(new Error('no request context'));

      const { captureEvent } = await import('../posthog-server');
      await captureEvent('background-event');

      expect(mockCapture).toHaveBeenCalledWith(
        expect.objectContaining({
          properties: expect.not.objectContaining({
            $session_id: expect.anything(),
          }),
        }),
      );
    });

    it('swallows errors thrown by underlying lookups', async () => {
      mockGetDisableAnalytics.mockRejectedValue(new Error('db down'));

      const { captureEvent } = await import('../posthog-server');

      await expect(
        captureEvent('test-event', { key: 'value' }),
      ).resolves.toBeUndefined();
      expect(mockCapture).not.toHaveBeenCalled();
    });
  });

  describe('captureException', () => {
    it('returns early when analytics disabled', async () => {
      mockGetDisableAnalytics.mockResolvedValue(true);

      const { captureException } = await import('../posthog-server');
      await captureException(new Error('test'), { extra: 'data' });

      expect(mockGetDisableAnalytics).toHaveBeenCalled();
      expect(mockGetInstallationId).not.toHaveBeenCalled();
      expect(mockCaptureException).not.toHaveBeenCalled();
    });

    it('calls captureException with correct args when analytics enabled', async () => {
      mockGetDisableAnalytics.mockResolvedValue(false);
      mockGetInstallationId.mockResolvedValue('install-123');

      const error = new Error('test error');
      const { captureException } = await import('../posthog-server');
      await captureException(error, { extra: 'data' });

      expect(mockCaptureException).toHaveBeenCalledWith(error, 'install-123', {
        extra: 'data',
        app: 'Fresco',
        $app_name: 'Fresco',
        host_version: '4.1.1',
        $app_version: '4.1.1',
        installation_id: 'install-123',
        $source: 'server',
      });
    });

    it('adds the browser session ID to server exceptions', async () => {
      mockGetDisableAnalytics.mockResolvedValue(false);
      mockGetInstallationId.mockResolvedValue('install-123');
      mockHeaders.mockResolvedValue(
        new Headers({ 'x-posthog-session-id': 'browser-session-123' }),
      );

      const error = new Error('test error');
      const { captureException } = await import('../posthog-server');
      await captureException(error);

      expect(mockCaptureException).toHaveBeenCalledWith(
        error,
        'install-123',
        expect.objectContaining({
          $session_id: 'browser-session-123',
        }),
      );
    });

    it('swallows errors thrown by underlying lookups', async () => {
      mockGetDisableAnalytics.mockRejectedValue(new Error('db down'));

      const { captureException } = await import('../posthog-server');

      await expect(
        captureException(new Error('test'), { extra: 'data' }),
      ).resolves.toBeUndefined();
      expect(mockCaptureException).not.toHaveBeenCalled();
    });
  });

  describe('flushPostHog', () => {
    it('flushes what has been captured', async () => {
      mockGetDisableAnalytics.mockResolvedValue(false);
      mockGetInstallationId.mockResolvedValue('install-123');

      const { captureEvent, flushPostHog } = await import('../posthog-server');

      await captureEvent('init-event');
      expect(mockCapture).toHaveBeenCalledTimes(1);

      await flushPostHog();
      expect(mockFlush).toHaveBeenCalledTimes(1);
    });

    // One request can queue several `after` callbacks — a route's telemetry
    // alongside activity recorded by the action it called — and Next runs them
    // concurrently against one shared client. Tearing that client down let
    // whichever finished first strand the other's event; every flush must
    // reach the client that holds it.
    it('flushes for every caller sharing the client', async () => {
      mockGetDisableAnalytics.mockResolvedValue(false);
      mockGetInstallationId.mockResolvedValue('install-123');

      const { captureEvent, flushPostHog } = await import('../posthog-server');

      // Two callbacks capture against the one shared client...
      await captureEvent('route-event');
      await captureEvent('activity-event');

      // ...and each then flushes what it captured. Under a teardown the first
      // would drop the shared client, and the second would find nothing to
      // flush and return with its event still queued.
      await flushPostHog();
      await flushPostHog();

      expect(mockFlush).toHaveBeenCalledTimes(2);
    });

    it('does not throw when the client has nothing to flush', async () => {
      const { flushPostHog } = await import('../posthog-server');

      await expect(flushPostHog()).resolves.toBeUndefined();
      expect(mockFlush).not.toHaveBeenCalled();
    });

    it('swallows a failing flush', async () => {
      mockGetDisableAnalytics.mockResolvedValue(false);
      mockGetInstallationId.mockResolvedValue('install-123');
      mockFlush.mockRejectedValueOnce(new Error('network down'));

      const { captureEvent, flushPostHog } = await import('../posthog-server');

      await captureEvent('init-event');

      await expect(flushPostHog()).resolves.toBeUndefined();
    });
  });
});
