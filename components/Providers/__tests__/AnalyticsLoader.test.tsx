import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetDisableAnalytics, mockGetInstallationId } = vi.hoisted(() => ({
  mockGetDisableAnalytics: vi.fn(),
  mockGetInstallationId: vi.fn(),
}));

vi.mock('next/server', () => ({
  connection: () => Promise.resolve(),
}));

vi.mock('~/queries/appSettings', () => ({
  getDisableAnalytics: mockGetDisableAnalytics,
  getInstallationId: mockGetInstallationId,
}));

import AnalyticsLoader from '../AnalyticsLoader';

type RenderedChild = { props?: { name?: unknown; content?: unknown } };

/** The decision the rendered tag publishes, for instrumentation-client. */
async function publishedDecision() {
  const element = await AnalyticsLoader();
  const children: RenderedChild[] = element.props.children;

  const tag = children.find(
    (child) => child.props?.name === 'fresco-analytics',
  );
  const content = tag?.props?.content;

  if (typeof content !== 'string') {
    throw new TypeError('no decision was published');
  }

  return JSON.parse(content) as Record<string, unknown>;
}

/** The decision handed to the component that follows later changes. */
async function appliedDecision() {
  const element = await AnalyticsLoader();
  const children: { props?: { decision?: unknown } }[] = element.props.children;

  return children.find((child) => child.props?.decision)?.props?.decision;
}

describe('AnalyticsLoader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetInstallationId.mockResolvedValue('install-123');
  });

  // PostHog contacts the relay as soon as it initialises, and opting out
  // afterwards does not take those requests back, so the browser must be told
  // not to load it at all.
  it('publishes a disabled decision when analytics are disabled', async () => {
    mockGetDisableAnalytics.mockResolvedValue(true);

    await expect(publishedDecision()).resolves.toEqual({ enabled: false });
  });

  it('does not even look up the installation ID when analytics are disabled', async () => {
    mockGetDisableAnalytics.mockResolvedValue(true);

    await AnalyticsLoader();

    expect(mockGetInstallationId).not.toHaveBeenCalled();
  });

  it('publishes the installation ID when analytics are enabled', async () => {
    mockGetDisableAnalytics.mockResolvedValue(false);

    await expect(publishedDecision()).resolves.toEqual({
      enabled: true,
      installationId: 'install-123',
    });
  });

  it('stays disabled when the settings cannot be read', async () => {
    mockGetDisableAnalytics.mockRejectedValue(new Error('database is down'));

    await expect(publishedDecision()).resolves.toEqual({ enabled: false });
  });

  // The value reaches the browser as an attribute, so it is escaped by React
  // rather than being parsed as code. Recorded here because publishing it as
  // an inline script instead — the obvious alternative — would not have this
  // property.
  // The tag is read once, at page load. A researcher turning analytics off in
  // a tab that is already open re-renders this, and the tab has to stop
  // capturing without waiting for a reload.
  it('also hands the decision to the component that follows later changes', async () => {
    mockGetDisableAnalytics.mockResolvedValue(false);

    await expect(appliedDecision()).resolves.toEqual({
      enabled: true,
      installationId: 'install-123',
    });
  });

  it('cannot be broken out of by an installation ID', async () => {
    mockGetDisableAnalytics.mockResolvedValue(false);
    mockGetInstallationId.mockResolvedValue(
      '</script><script>alert(1)</script>',
    );

    await expect(publishedDecision()).resolves.toEqual({
      enabled: true,
      installationId: '</script><script>alert(1)</script>',
    });
  });
});
