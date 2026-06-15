import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, after: vi.fn() };
});

type UpdateManyArgs = {
  where: { id: { in: string[] } };
  data: { exportTime: Date };
};

const { updateMany, addEvent, captureEvent, safeUpdateTag } = vi.hoisted(
  () => ({
    updateMany: vi.fn<(args: UpdateManyArgs) => Promise<{ count: number }>>(),
    addEvent:
      vi.fn<
        (
          type: string,
          message: string,
        ) => Promise<{ success: boolean; error: null | string }>
      >(),
    captureEvent:
      vi.fn<
        (event: string, props?: Record<string, unknown>) => Promise<void>
      >(),
    safeUpdateTag: vi.fn<(tag: string) => void>(),
  }),
);

vi.mock('~/lib/auth/guards', () => ({
  requireApiAuth: vi.fn(() =>
    Promise.resolve({ user: { username: 'alice', userId: 'u1' } }),
  ),
}));
vi.mock('~/lib/db', () => ({ prisma: { interview: { updateMany } } }));
vi.mock('~/actions/activityFeed', () => ({ addEvent }));
vi.mock('~/lib/posthog-server', () => ({
  captureEvent,
  shutdownPostHog: vi.fn(() => Promise.resolve()),
}));
vi.mock('~/lib/cache', () => ({
  safeUpdateTag,
  safeRevalidateTag: vi.fn(),
}));

import { commitInterviewExport } from '~/actions/interviews';

describe('commitInterviewExport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateMany.mockResolvedValue({ count: 2 });
  });

  it('sets exportTime for the (deduped) ids and revalidates caches', async () => {
    const result = await commitInterviewExport(['a', 'b', 'a']);
    expect(updateMany).toHaveBeenCalledOnce();
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: ['a', 'b'] } },
      }),
    );
    const firstArg = updateMany.mock.calls[0]?.[0];
    expect(firstArg?.data.exportTime).toBeInstanceOf(Date);
    expect(safeUpdateTag).toHaveBeenCalledWith('getInterviews');
    expect(safeUpdateTag).toHaveBeenCalledWith('activityFeed');
    expect(result).toEqual({ error: null, data: { count: 2 } });
  });

  it('is a no-op for an empty id list', async () => {
    const result = await commitInterviewExport([]);
    expect(updateMany).not.toHaveBeenCalled();
    expect(result).toEqual({ error: null, data: { count: 0 } });
  });
});
