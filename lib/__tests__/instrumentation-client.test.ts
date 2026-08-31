import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockStartPostHog, mockStopPostHog } = vi.hoisted(() => ({
  mockStartPostHog: vi.fn(() => Promise.resolve()),
  mockStopPostHog: vi.fn(() => Promise.resolve()),
}));

vi.mock('~/lib/posthog-client', () => ({
  startPostHog: mockStartPostHog,
  stopPostHog: mockStopPostHog,
}));

/** The module acts on import, so each test needs its own copy. */
async function loadInstrumentation() {
  vi.resetModules();
  await import('~/instrumentation-client');
}

function publishDecision(content: string) {
  // Replaces any tag already published: only the first one in the document is
  // ever read, so appending a second would silently test nothing.
  document
    .querySelectorAll('meta[name="fresco-analytics"]')
    .forEach((existing) => existing.remove());

  const meta = document.createElement('meta');
  meta.setAttribute('name', 'fresco-analytics');
  meta.setAttribute('content', content);
  document.head.append(meta);
  return meta;
}

/** Lets the MutationObserver callback run. */
function settle() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('instrumentation-client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.head.innerHTML = '';
  });

  it('starts analytics from a decision already in the document', async () => {
    publishDecision('{"enabled":true,"installationId":"install-123"}');

    await loadInstrumentation();

    expect(mockStartPostHog).toHaveBeenCalledWith('install-123');
    expect(mockStopPostHog).not.toHaveBeenCalled();
  });

  // AnalyticsLoader streams in from inside a Suspense boundary, so the tag
  // usually lands after this module has already run. This is the case the
  // whole design exists for: it must not depend on React having hydrated.
  it('starts analytics from a decision that arrives afterwards', async () => {
    await loadInstrumentation();

    expect(mockStartPostHog).not.toHaveBeenCalled();

    publishDecision('{"enabled":true,"installationId":"install-123"}');
    await settle();

    expect(mockStartPostHog).toHaveBeenCalledWith('install-123');
  });

  it('starts analytics without an installation ID when there is none', async () => {
    await loadInstrumentation();

    publishDecision('{"enabled":true}');
    await settle();

    expect(mockStartPostHog).toHaveBeenCalledWith(undefined);
  });

  // The deployment said no. Starting is what would reach the relay.
  it('never starts analytics for a disabled decision', async () => {
    publishDecision('{"enabled":false}');

    await loadInstrumentation();

    expect(mockStartPostHog).not.toHaveBeenCalled();
    expect(mockStopPostHog).toHaveBeenCalled();
  });

  it('ignores content that is not JSON', async () => {
    await loadInstrumentation();

    publishDecision('not json');
    await settle();

    expect(mockStartPostHog).not.toHaveBeenCalled();
    expect(mockStopPostHog).not.toHaveBeenCalled();
  });

  it('ignores JSON that is not a decision', async () => {
    await loadInstrumentation();

    publishDecision('{"enabled":"yes"}');
    await settle();

    expect(mockStartPostHog).not.toHaveBeenCalled();
    expect(mockStopPostHog).not.toHaveBeenCalled();
  });

  it('ignores a decision that is not an object', async () => {
    await loadInstrumentation();

    publishDecision('"enabled"');
    await settle();

    expect(mockStartPostHog).not.toHaveBeenCalled();
    expect(mockStopPostHog).not.toHaveBeenCalled();
  });

  // Without an answer we do not know whether this deployment consented, so
  // nothing starts.
  it('does nothing when the page finishes loading with no decision', async () => {
    await loadInstrumentation();

    window.dispatchEvent(new Event('load'));
    await settle();

    expect(mockStartPostHog).not.toHaveBeenCalled();
    expect(mockStopPostHog).not.toHaveBeenCalled();
  });

  // The observer spots the tag arriving, and the load handler that shuts the
  // observer down reads it again. Acting twice would re-identify the browser.
  it('acts on the decision once, however many times it is seen', async () => {
    await loadInstrumentation();

    publishDecision('{"enabled":true,"installationId":"install-123"}');
    await settle();

    window.dispatchEvent(new Event('load'));
    await settle();

    expect(mockStartPostHog).toHaveBeenCalledTimes(1);
  });

  it('stops watching once the page has loaded', async () => {
    await loadInstrumentation();

    window.dispatchEvent(new Event('load'));
    await settle();

    publishDecision('{"enabled":true,"installationId":"install-123"}');
    await settle();

    expect(mockStartPostHog).not.toHaveBeenCalled();
  });
});
