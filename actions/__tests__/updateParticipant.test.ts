import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock server-only first to prevent import errors
vi.mock('server-only', () => ({}));

const { mockPrismaUpdate, mockSafeUpdateTag } = vi.hoisted(() => ({
  mockPrismaUpdate: vi.fn(),
  mockSafeUpdateTag: vi.fn(),
}));

vi.mock('~/lib/db', () => ({
  prisma: {
    participant: {
      update: mockPrismaUpdate,
    },
  },
}));

vi.mock('~/lib/cache', () => ({
  safeUpdateTag: mockSafeUpdateTag,
  safeRevalidateTag: vi.fn(),
  safeCacheTag: vi.fn(),
}));

vi.mock('~/lib/auth/guards', () => ({
  requireApiAuth: vi.fn().mockResolvedValue({ user: { username: 'admin' } }),
}));

vi.mock('~/lib/activityFeed', () => ({
  addEvent: vi.fn(),
}));

import { updateParticipant } from '~/actions/participants';

describe('updateParticipant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrismaUpdate.mockResolvedValue({
      id: 'participant-1',
      identifier: 'P001',
      label: null,
      isSynthetic: false,
    });
  });

  it('writes null for a cleared label so it is actually removed', async () => {
    await updateParticipant({
      existingIdentifier: 'P001',
      formData: { identifier: 'P001', label: '' },
    });

    expect(mockPrismaUpdate).toHaveBeenCalledWith({
      where: { identifier: 'P001' },
      data: { identifier: 'P001', label: null },
    });
  });

  it('writes null when no label is supplied at all', async () => {
    await updateParticipant({
      existingIdentifier: 'P001',
      formData: { identifier: 'P001' },
    });

    expect(mockPrismaUpdate).toHaveBeenCalledWith({
      where: { identifier: 'P001' },
      data: { identifier: 'P001', label: null },
    });
  });

  it('preserves a supplied label', async () => {
    await updateParticipant({
      existingIdentifier: 'P001',
      formData: { identifier: 'P002', label: 'Alice' },
    });

    expect(mockPrismaUpdate).toHaveBeenCalledWith({
      where: { identifier: 'P001' },
      data: { identifier: 'P002', label: 'Alice' },
    });
  });

  it('invalidates the interviews dashboard cache', async () => {
    await updateParticipant({
      existingIdentifier: 'P001',
      formData: { identifier: 'P002' },
    });

    expect(mockSafeUpdateTag).toHaveBeenCalledWith('getParticipants');
    expect(mockSafeUpdateTag).toHaveBeenCalledWith('getInterviews');
    expect(mockSafeUpdateTag).toHaveBeenCalledWith('summaryStatistics');
  });
});
