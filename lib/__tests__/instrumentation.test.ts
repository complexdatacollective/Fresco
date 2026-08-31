import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockCaptureException,
  mockFlush,
  mockGetPostHogSessionProperties,
  mockFindUnique,
  mockEnv,
} = vi.hoisted(() => ({
  mockCaptureException: vi.fn(),
  mockFlush: vi.fn().mockResolvedValue(undefined),
  mockGetPostHogSessionProperties: vi.fn(),
  mockFindUnique: vi.fn(),
  mockEnv: { INSTALLATION_ID: 'install-123' } as {
    INSTALLATION_ID?: string;
    DISABLE_ANALYTICS?: boolean;
  },
}));

// The PostHog client itself is the only thing stubbed out. The settings and
// installation-ID reads run for real against the mocked database and
// environment below, so these tests still exercise the actual consent logic.
vi.mock('posthog-node', () => {
  const MockPostHog = vi.fn(function (this: Record<string, unknown>) {
    this.captureException = mockCaptureException;
    this.flush = mockFlush;
  });
  return { PostHog: MockPostHog };
});

vi.mock(import('../../lib/posthog-server'), async (importOriginal) => ({
  ...(await importOriginal()),
  getPostHogSessionProperties: mockGetPostHogSessionProperties,
}));

vi.mock('../../env', () => ({
  env: mockEnv,
}));

vi.mock('../../fresco.config', () => ({
  POSTHOG_API_KEY: 'test-api-key',
  POSTHOG_PROXY_HOST: 'https://test.example.com',
  POSTHOG_APP_PROPERTIES: {
    app: 'Fresco',
    $app_name: 'Fresco',
    host_version: '4.1.1',
    $app_version: '4.1.1',
  },
}));

vi.mock('../../lib/db', () => ({
  prisma: { appSettings: { findUnique: mockFindUnique } },
}));

const REQUEST = {
  path: '/test',
  method: 'GET',
  headers: { 'x-posthog-session-id': 'browser-session-123' },
};

const CONTEXT = {
  routerKind: 'App Router',
  routePath: '/test',
  routeType: 'route',
  revalidateReason: undefined,
} as const;

describe('Fresco request-error instrumentation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NEXT_RUNTIME', 'nodejs');
    mockEnv.INSTALLATION_ID = 'install-123';
    delete mockEnv.DISABLE_ANALYTICS;
    mockFindUnique.mockResolvedValue(null);
    mockGetPostHogSessionProperties.mockReturnValue({
      $session_id: 'browser-session-123',
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('adds the browser session ID to server request errors', async () => {
    const error = new Error('request failed');
    const { onRequestError } = await import('../../instrumentation');

    await onRequestError(error, REQUEST, CONTEXT);

    expect(mockGetPostHogSessionProperties).toHaveBeenCalledWith(
      'browser-session-123',
    );
    expect(mockCaptureException).toHaveBeenCalledWith(
      error,
      'install-123',
      expect.objectContaining({
        $session_id: 'browser-session-123',
        $source: 'server',
      }),
    );
    expect(mockFlush).toHaveBeenCalledOnce();
  });

  it('sends nothing when DISABLE_ANALYTICS is set', async () => {
    mockEnv.DISABLE_ANALYTICS = true;
    const { onRequestError } = await import('../../instrumentation');

    await onRequestError(new Error('request failed'), REQUEST, CONTEXT);

    expect(mockCaptureException).not.toHaveBeenCalled();
    expect(mockFlush).not.toHaveBeenCalled();
  });

  it('sends nothing when the stored setting disables analytics', async () => {
    mockFindUnique.mockResolvedValue({
      key: 'disableAnalytics',
      value: 'true',
    });
    const { onRequestError } = await import('../../instrumentation');

    await onRequestError(new Error('request failed'), REQUEST, CONTEXT);

    expect(mockCaptureException).not.toHaveBeenCalled();
  });

  it('stays silent when the setting cannot be read', async () => {
    mockFindUnique.mockRejectedValue(new Error('database is down'));
    const { onRequestError } = await import('../../instrumentation');

    await onRequestError(new Error('request failed'), REQUEST, CONTEXT);

    expect(mockCaptureException).not.toHaveBeenCalled();
  });
});
