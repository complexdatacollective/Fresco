import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockStartPostHog, mockStopPostHog } = vi.hoisted(() => ({
  mockStartPostHog: vi.fn(() => Promise.resolve()),
  mockStopPostHog: vi.fn(() => Promise.resolve()),
}));

vi.mock('~/lib/posthog-client', () => ({
  startPostHog: mockStartPostHog,
  stopPostHog: mockStopPostHog,
}));

/** The last-applied answer is module state, so each test needs its own copy. */
async function loadApplier() {
  vi.resetModules();
  return import('../applyAnalyticsDecision');
}

describe('applyAnalyticsDecision', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts analytics for an enabled deployment', async () => {
    const { applyAnalyticsDecision } = await loadApplier();

    applyAnalyticsDecision({ enabled: true, installationId: 'install-123' });

    expect(mockStartPostHog).toHaveBeenCalledWith('install-123');
    expect(mockStopPostHog).not.toHaveBeenCalled();
  });

  it('stops analytics for a disabled deployment', async () => {
    const { applyAnalyticsDecision } = await loadApplier();

    applyAnalyticsDecision({ enabled: false });

    expect(mockStopPostHog).toHaveBeenCalled();
    expect(mockStartPostHog).not.toHaveBeenCalled();
  });

  // Both instrumentation-client and the component routinely see the same
  // answer. Acting twice would identify the browser and repeat the opt-in.
  it('ignores an answer it has already acted on', async () => {
    const { applyAnalyticsDecision } = await loadApplier();

    applyAnalyticsDecision({ enabled: true, installationId: 'install-123' });
    applyAnalyticsDecision({ enabled: true, installationId: 'install-123' });

    expect(mockStartPostHog).toHaveBeenCalledTimes(1);
  });

  // A researcher turning analytics off in a tab that is already open. This is
  // the case the component exists for, and the reason the guard above compares
  // answers rather than latching after the first one.
  it('acts when the answer changes', async () => {
    const { applyAnalyticsDecision } = await loadApplier();

    applyAnalyticsDecision({ enabled: true, installationId: 'install-123' });
    applyAnalyticsDecision({ enabled: false });

    expect(mockStopPostHog).toHaveBeenCalledTimes(1);
  });

  it('acts when the installation ID changes', async () => {
    const { applyAnalyticsDecision } = await loadApplier();

    applyAnalyticsDecision({ enabled: true, installationId: 'install-123' });
    applyAnalyticsDecision({ enabled: true, installationId: 'install-456' });

    expect(mockStartPostHog).toHaveBeenCalledTimes(2);
    expect(mockStartPostHog).toHaveBeenLastCalledWith('install-456');
  });
});
