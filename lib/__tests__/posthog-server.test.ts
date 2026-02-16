import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockCapture,
  mockCaptureException,
  mockShutdown,
  mockGetDisableAnalytics,
  mockGetInstallationId,
} = vi.hoisted(() => ({
  mockCapture: vi.fn(),
  mockCaptureException: vi.fn(),
  mockShutdown: vi.fn().mockResolvedValue(undefined),
  mockGetDisableAnalytics: vi.fn(),
  mockGetInstallationId: vi.fn(),
}));

vi.mock('posthog-node', () => {
  const MockPostHog = vi.fn(function (this: Record<string, unknown>) {
    this.capture = mockCapture;
    this.captureException = mockCaptureException;
    this.shutdown = mockShutdown;
  });
  return { PostHog: MockPostHog };
});

vi.mock('~/queries/appSettings', () => ({
  getDisableAnalytics: mockGetDisableAnalytics,
  getInstallationId: mockGetInstallationId,
}));

vi.mock('~/fresco.config', () => ({
  POSTHOG_API_KEY: 'test-api-key',
  POSTHOG_APP_NAME: 'Fresco',
  POSTHOG_PROXY_HOST: 'https://test.example.com',
}));

describe('posthog-server', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
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
          installation_id: 'install-123',
          key: 'value',
          $source: 'server',
        },
      });
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
      });
    });
  });

  describe('shutdownPostHog', () => {
    it('calls shutdown and allows re-initialization', async () => {
      mockGetDisableAnalytics.mockResolvedValue(false);
      mockGetInstallationId.mockResolvedValue('install-123');

      const { captureEvent, shutdownPostHog } =
        await import('../posthog-server');

      // Initialize the client by making a call
      await captureEvent('init-event');
      expect(mockCapture).toHaveBeenCalledTimes(1);

      // Shutdown
      await shutdownPostHog();
      expect(mockShutdown).toHaveBeenCalledTimes(1);

      // Re-initialize by making another call
      await captureEvent('post-shutdown-event');
      expect(mockCapture).toHaveBeenCalledTimes(2);
    });
  });
});
