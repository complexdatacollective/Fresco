import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { useScrolledToBottom } from '~/hooks/useScrolledToBottom';

type IOCallback = IntersectionObserverCallback;

let latestObserverInstances: MockIntersectionObserver[];

class MockIntersectionObserver {
  callback: IOCallback;
  observeSpy = vi.fn();
  disconnectSpy = vi.fn();
  root: Element | Document | null;

  constructor(cb: IOCallback, options?: IntersectionObserverInit) {
    this.callback = cb;
    this.root = (options?.root as Element | Document | null) ?? null;
    latestObserverInstances.push(this);
  }

  observe(target: Element) {
    this.observeSpy(target);
  }

  unobserve() {
    // no-op: required by IntersectionObserver interface
  }

  disconnect() {
    this.disconnectSpy();
  }
}

function latest() {
  return latestObserverInstances[latestObserverInstances.length - 1] ?? null;
}

describe('useScrolledToBottom', () => {
  afterEach(() => {
    latestObserverInstances = [];
    vi.restoreAllMocks();
  });

  test('returns false initially', () => {
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

    const { result } = renderHook(() => useScrolledToBottom());

    expect(result.current.isAtBottom).toBe(false);
  });

  test('observes sentinel when callback ref is attached', () => {
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

    const { result } = renderHook(() => useScrolledToBottom());

    const sentinelEl = document.createElement('div');
    act(() => {
      result.current.sentinelRef(sentinelEl);
    });

    expect(latest()?.observeSpy).toHaveBeenCalledWith(sentinelEl);
  });

  test('returns true when sentinel becomes visible', () => {
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

    const { result } = renderHook(() => useScrolledToBottom());

    const sentinelEl = document.createElement('div');
    act(() => {
      result.current.sentinelRef(sentinelEl);
    });

    act(() => {
      latest()?.callback(
        [{ isIntersecting: true }] as IntersectionObserverEntry[],
        latest() as unknown as IntersectionObserver,
      );
    });

    expect(result.current.isAtBottom).toBe(true);
  });

  test('returns false when sentinel leaves viewport', () => {
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

    const { result } = renderHook(() => useScrolledToBottom());

    const sentinelEl = document.createElement('div');
    act(() => {
      result.current.sentinelRef(sentinelEl);
    });

    act(() => {
      latest()?.callback(
        [{ isIntersecting: true }] as IntersectionObserverEntry[],
        latest() as unknown as IntersectionObserver,
      );
    });
    expect(result.current.isAtBottom).toBe(true);

    act(() => {
      latest()?.callback(
        [{ isIntersecting: false }] as IntersectionObserverEntry[],
        latest() as unknown as IntersectionObserver,
      );
    });
    expect(result.current.isAtBottom).toBe(false);
  });

  test('disconnects old observer when sentinel changes', () => {
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

    const { result } = renderHook(() => useScrolledToBottom());

    const firstEl = document.createElement('div');
    act(() => {
      result.current.sentinelRef(firstEl);
    });

    const firstObserver = latest();

    const secondEl = document.createElement('div');
    act(() => {
      result.current.sentinelRef(secondEl);
    });

    expect(firstObserver?.disconnectSpy).toHaveBeenCalled();
    expect(latest()?.observeSpy).toHaveBeenCalledWith(secondEl);
  });

  test('disconnects observer on unmount', () => {
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

    const { result, unmount } = renderHook(() => useScrolledToBottom());

    const sentinelEl = document.createElement('div');
    act(() => {
      result.current.sentinelRef(sentinelEl);
    });

    const observer = latest();
    unmount();
    expect(observer?.disconnectSpy).toHaveBeenCalled();
  });

  test('resets to false when sentinel detaches (null)', () => {
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

    const { result } = renderHook(() => useScrolledToBottom());

    const sentinelEl = document.createElement('div');
    act(() => {
      result.current.sentinelRef(sentinelEl);
    });

    act(() => {
      latest()?.callback(
        [{ isIntersecting: true }] as IntersectionObserverEntry[],
        latest() as unknown as IntersectionObserver,
      );
    });
    expect(result.current.isAtBottom).toBe(true);

    act(() => {
      result.current.sentinelRef(null);
    });
    expect(result.current.isAtBottom).toBe(false);
  });
});
