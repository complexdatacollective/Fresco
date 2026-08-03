import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockCacheTag, mockUpdateTag, mockRevalidateTag } = vi.hoisted(() => ({
  mockCacheTag: vi.fn(),
  mockUpdateTag: vi.fn(),
  mockRevalidateTag: vi.fn(),
}));

vi.mock('next/cache', () => ({
  cacheTag: mockCacheTag,
  updateTag: mockUpdateTag,
  revalidateTag: mockRevalidateTag,
}));

import { safeCacheTag, safeRevalidateTag, safeUpdateTag } from '../cache';

describe('safeUpdateTag', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call updateTag for a single tag', () => {
    safeUpdateTag('getInterviews');
    expect(mockUpdateTag).toHaveBeenCalledWith('getInterviews');
  });

  it('should call updateTag for each tag in an array', () => {
    safeUpdateTag(['getInterviews', 'getParticipants']);
    expect(mockUpdateTag).toHaveBeenCalledWith('getInterviews');
    expect(mockUpdateTag).toHaveBeenCalledWith('getParticipants');
  });
});

describe('safeRevalidateTag', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call revalidateTag with max profile for a single tag', () => {
    safeRevalidateTag('getInterviews');
    expect(mockRevalidateTag).toHaveBeenCalledWith('getInterviews', 'max');
  });

  it('should call revalidateTag with max profile for each tag in an array', () => {
    safeRevalidateTag(['getInterviews', 'getParticipants']);
    expect(mockRevalidateTag).toHaveBeenCalledWith('getInterviews', 'max');
    expect(mockRevalidateTag).toHaveBeenCalledWith('getParticipants', 'max');
  });
});

describe('safeCacheTag', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call cacheTag for a single tag', () => {
    safeCacheTag('getInterviews');
    expect(mockCacheTag).toHaveBeenCalledWith('getInterviews');
  });

  it('should call cacheTag for each tag in an array', () => {
    safeCacheTag(['getInterviews', 'getParticipants']);
    expect(mockCacheTag).toHaveBeenCalledWith('getInterviews');
    expect(mockCacheTag).toHaveBeenCalledWith('getParticipants');
  });
});
