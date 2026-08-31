import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const {
  mockCreateMany,
  mockCaptureEvent,
  mockShutdownPostHog,
  mockSafeUpdateTag,
  afterCallbacks,
} = vi.hoisted(() => ({
  mockCreateMany: vi.fn(),
  mockCaptureEvent: vi.fn(),
  mockShutdownPostHog: vi.fn(),
  mockSafeUpdateTag: vi.fn(),
  afterCallbacks: [] as (() => Promise<unknown>)[],
}));

vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    // Collect rather than run, so tests can assert on *when* registration
    // happened and on what the callback holds open, not just its effects.
    after: vi.fn((callback: () => Promise<unknown>) => {
      afterCallbacks.push(callback);
    }),
  };
});

vi.mock('~/lib/db', () => ({
  prisma: {
    events: {
      createMany: mockCreateMany,
    },
  },
}));

vi.mock('~/lib/cache', () => ({
  safeUpdateTag: mockSafeUpdateTag,
}));

vi.mock('~/lib/posthog-server', () => ({
  captureEvent: mockCaptureEvent,
  flushPostHog: mockShutdownPostHog,
}));

import { addEvent, addEvents } from '../activityFeed';

const flushAfterCallbacks = async () => {
  for (const callback of afterCallbacks.splice(0)) {
    await callback();
  }
};

const nextTick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('activity feed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    afterCallbacks.length = 0;
    mockCreateMany.mockResolvedValue({ count: 1 });
  });

  describe('work that must outlive the response', () => {
    // The regression this guards: registering `after` only once the feed write
    // had resolved. Callers almost always fire these without awaiting, so by
    // then the request scope was gone, `after` threw, and the error was
    // swallowed — analytics silently stopped for every unawaited caller.
    it('registers before the feed write settles', () => {
      mockCreateMany.mockReturnValue(new Promise(() => undefined));

      void addEvent('Protocol Uninstalled', 'User admin uninstalled "Study"');

      expect(afterCallbacks).toHaveLength(1);
    });

    // Nothing else awaits the write when the caller does not, so the callback
    // adopting it is the only thing keeping a serverless invocation alive
    // until the row lands.
    it('holds the invocation open until the feed write lands', async () => {
      let settleWrite!: (value: { count: number }) => void;
      mockCreateMany.mockReturnValue(
        new Promise<{ count: number }>((resolve) => {
          settleWrite = resolve;
        }),
      );

      void addEvent('Protocol Uninstalled', 'User admin uninstalled "Study"');

      const callback = afterCallbacks[0];
      expect(callback).toBeDefined();

      let finished = false;
      const running = callback!().then(() => {
        finished = true;
        return null;
      });

      await nextTick();
      expect(finished).toBe(false);

      settleWrite({ count: 1 });
      await running;

      expect(finished).toBe(true);
    });

    it('reports the activity even when the caller does not await it', async () => {
      void addEvent('Protocol Uninstalled', 'User admin uninstalled "Study"');
      await flushAfterCallbacks();

      expect(mockCaptureEvent).toHaveBeenCalledWith(
        'Protocol Uninstalled',
        undefined,
      );
    });
  });

  describe('what reaches analytics', () => {
    // The message is prose for the researcher reading the feed and carries
    // usernames and participant identifiers. It must not leave the
    // installation.
    it('does not report the activity message', async () => {
      await addEvent(
        'Interview Started',
        'Participant "Ada Lovelace (P-001)" started an interview',
      );
      await flushAfterCallbacks();

      const [, reportedProperties] = mockCaptureEvent.mock.calls[0] as [
        string,
        Record<string, unknown> | undefined,
      ];

      expect(JSON.stringify(reportedProperties ?? {})).not.toContain('P-001');
    });

    it('reports explicitly-passed properties', async () => {
      await addEvent('Data Exported', 'User admin exported 3 interview(s)', {
        interviewCount: 3,
      });
      await flushAfterCallbacks();

      expect(mockCaptureEvent).toHaveBeenCalledWith('Data Exported', {
        interviewCount: 3,
      });
    });

    // A database refusing writes is precisely when the reports matter.
    it('reports the activity even when the feed write fails', async () => {
      mockCreateMany.mockRejectedValue(new Error('Connection refused'));

      const result = await addEvent(
        'Protocol Uninstalled',
        'User admin uninstalled "Study"',
      );
      await flushAfterCallbacks();

      expect(result).toEqual({ success: false, error: 'Failed to add event' });
      expect(mockCaptureEvent).toHaveBeenCalledWith(
        'Protocol Uninstalled',
        undefined,
      );
    });
  });

  describe('the feed', () => {
    it('writes the message and invalidates the feed', async () => {
      await addEvent('Protocol Uninstalled', 'User admin uninstalled "Study"');

      expect(mockCreateMany).toHaveBeenCalledWith({
        data: [
          {
            type: 'Protocol Uninstalled',
            message: 'User admin uninstalled "Study"',
          },
        ],
      });
      expect(mockSafeUpdateTag).toHaveBeenCalledWith('activityFeed');
    });

    // updateTag is only available in Server Actions, and most callers are not
    // in one by the time this runs. A failed invalidation costs a slightly
    // later refresh, never the row.
    it('still succeeds when the feed cannot be invalidated', async () => {
      mockSafeUpdateTag.mockImplementation(() => {
        throw new Error('updateTag is not available here');
      });

      const result = await addEvent(
        'Protocol Uninstalled',
        'User admin uninstalled "Study"',
      );

      expect(result).toEqual({ success: true, error: null });
    });
  });

  describe('batches', () => {
    it('writes one row per activity and reports each one', async () => {
      await addEvents([
        { type: 'Protocol Uninstalled', message: 'User admin removed "A"' },
        { type: 'Protocol Uninstalled', message: 'User admin removed "B"' },
      ]);
      await flushAfterCallbacks();

      expect(mockCreateMany).toHaveBeenCalledTimes(1);
      expect(mockCreateMany.mock.calls[0]).toEqual([
        {
          data: [
            { type: 'Protocol Uninstalled', message: 'User admin removed "A"' },
            { type: 'Protocol Uninstalled', message: 'User admin removed "B"' },
          ],
        },
      ]);
      expect(mockCaptureEvent).toHaveBeenCalledTimes(2);
    });

    // Shutting the client down is what flushes it, and it nulls the shared
    // instance. One callback per activity would race its own siblings.
    it('shuts the analytics client down once for the whole batch', async () => {
      await addEvents([
        { type: 'Protocol Uninstalled', message: 'User admin removed "A"' },
        { type: 'Protocol Uninstalled', message: 'User admin removed "B"' },
        { type: 'Protocol Uninstalled', message: 'User admin removed "C"' },
      ]);

      expect(afterCallbacks).toHaveLength(1);

      await flushAfterCallbacks();

      expect(mockShutdownPostHog).toHaveBeenCalledTimes(1);
    });

    it('does nothing when there is nothing to record', async () => {
      const result = await addEvents([]);

      expect(result).toEqual({ success: true, error: null });
      expect(mockCreateMany).not.toHaveBeenCalled();
      expect(afterCallbacks).toHaveLength(0);
    });
  });
});
