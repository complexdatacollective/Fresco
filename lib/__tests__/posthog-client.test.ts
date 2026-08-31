import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  init,
  register,
  identify,
  optInCapturing,
  optOutCapturing,
  captureException,
  capture,
  shutdown,
  startSessionRecording,
  stopSessionRecording,
  sessionRecordingStarted,
  calls,
} = vi.hoisted(() => {
  const order: string[] = [];
  return {
    calls: order,
    init: vi.fn(
      (_key: string, _config: Record<string, unknown>) =>
        void order.push('init'),
    ),
    register: vi.fn(() => void order.push('register')),
    identify: vi.fn(),
    optInCapturing: vi.fn(() => void order.push('opt_in_capturing')),
    optOutCapturing: vi.fn(() => void order.push('opt_out_capturing')),
    captureException: vi.fn(),
    capture: vi.fn(),
    shutdown: vi.fn(() => {
      order.push('shutdown');
      return Promise.resolve();
    }),
    startSessionRecording: vi.fn(),
    stopSessionRecording: vi.fn(),
    sessionRecordingStarted: vi.fn(() => false),
  };
});

vi.mock('posthog-js', () => ({
  default: {
    init,
    register,
    identify,
    opt_in_capturing: optInCapturing,
    opt_out_capturing: optOutCapturing,
    captureException,
    capture,
    shutdown,
    startSessionRecording,
    stopSessionRecording,
    sessionRecordingStarted,
  },
}));

vi.mock('~/fresco.config', () => ({
  POSTHOG_API_KEY: 'phc_test',
  POSTHOG_PROXY_HOST: 'https://relay.example.com',
  POSTHOG_APP_PROPERTIES: {
    app: 'Fresco',
    $app_name: 'Fresco',
    host_version: '4.1.1',
    $app_version: '4.1.1',
  },
}));

async function loadModule() {
  vi.resetModules();
  return import('../posthog-client');
}

describe('Fresco PostHog client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    calls.length = 0;
  });

  // The whole point of the module: importing it must be inert, so that a
  // deployment with analytics disabled never reaches the relay. PostHog fires
  // its remote-config, extension-script and feature-flag requests the instant
  // init() runs, and opting out afterwards does not prevent them.
  it('does not initialise PostHog on import', async () => {
    await loadModule();

    expect(init).not.toHaveBeenCalled();
  });

  it('initialises PostHog only once startPostHog is called', async () => {
    const { startPostHog } = await loadModule();

    await startPostHog('install-123');

    expect(init).toHaveBeenCalledWith(
      'phc_test',
      expect.objectContaining({
        api_host: 'https://relay.example.com',
        // Propagates the browser session to same-origin server requests.
        tracing_headers: [window.location.hostname],
      }),
    );
  });

  it('opts a previously opted-out browser back in', async () => {
    const { startPostHog } = await loadModule();

    await startPostHog('install-123');

    expect(optInCapturing).toHaveBeenCalled();
  });

  // opt_in_capturing captures an event of its own, so the properties that
  // attribute events to Fresco have to be registered before it runs.
  it('registers the app properties before opting in', async () => {
    const { startPostHog } = await loadModule();

    await startPostHog('install-123');

    expect(calls).toEqual(['init', 'register', 'opt_in_capturing', 'register']);
  });

  it('registers the app properties and identifies by installation ID', async () => {
    const { startPostHog } = await loadModule();

    await startPostHog('install-123');

    expect(register).toHaveBeenCalledWith({
      app: 'Fresco',
      $app_name: 'Fresco',
      host_version: '4.1.1',
      $app_version: '4.1.1',
      installation_id: 'install-123',
    });
    expect(identify).toHaveBeenCalledWith('install-123');
  });

  it('registers the app properties but does not identify without an installation ID', async () => {
    const { startPostHog } = await loadModule();

    await startPostHog(undefined);

    expect(register).toHaveBeenCalledWith({
      app: 'Fresco',
      $app_name: 'Fresco',
      host_version: '4.1.1',
      $app_version: '4.1.1',
    });
    expect(identify).not.toHaveBeenCalled();
  });

  describe('stopPostHog', () => {
    // A deployment that never consented must not load posthog-js merely to
    // tell it to be quiet — loading it is the thing that reaches the relay.
    it('does not load PostHog when nothing was ever started', async () => {
      const { stopPostHog } = await loadModule();

      await stopPostHog();

      expect(init).not.toHaveBeenCalled();
      expect(optOutCapturing).not.toHaveBeenCalled();
    });

    it('opts out a client this tab had already started', async () => {
      const { startPostHog, stopPostHog } = await loadModule();

      await startPostHog('install-123');
      await stopPostHog();

      expect(optOutCapturing).toHaveBeenCalled();
    });

    // Opting out leaves the remote-config loader refreshing feature flags
    // every five minutes; only shutdown ends that.
    it('shuts the client down, not just opts it out', async () => {
      const { startPostHog, stopPostHog } = await loadModule();

      await startPostHog('install-123');
      await stopPostHog();

      expect(optOutCapturing).toHaveBeenCalled();
      expect(shutdown).toHaveBeenCalled();
      expect(calls.indexOf('opt_out_capturing')).toBeLessThan(
        calls.indexOf('shutdown'),
      );
    });

    // posthog-js cannot be revived after shutdown — init() sees __loaded and
    // returns — so the tab must stay quiet rather than pretend to restart.
    it('stays stopped until the next page load', async () => {
      const { startPostHog, stopPostHog } = await loadModule();

      await startPostHog('install-123');
      await stopPostHog();
      optInCapturing.mockClear();
      identify.mockClear();

      await startPostHog('install-123');

      expect(optInCapturing).not.toHaveBeenCalled();
      expect(identify).not.toHaveBeenCalled();
    });

    // The dynamic import of posthog-js takes a moment; a stop can land inside
    // that window, and the stale start must not undo it.
    it('does not opt back in when stopped while starting', async () => {
      const { startPostHog, stopPostHog } = await loadModule();

      const starting = startPostHog('install-123');
      const stopping = stopPostHog();
      await Promise.all([starting, stopping]);

      expect(calls.lastIndexOf('opt_in_capturing')).toBeLessThan(
        calls.indexOf('opt_out_capturing'),
      );
      expect(calls.at(-1)).toBe('shutdown');
    });

    // stopPostHog clears the queue, but nothing had started, so without a
    // record of the decision a later error would simply queue up again.
    it('drops later exceptions when disabled before anything started', async () => {
      const { stopPostHog, startPostHog, captureClientException } =
        await loadModule();

      await stopPostHog();
      captureClientException(new Error('raised while disabled'));
      await startPostHog('install-123');

      expect(captureException).not.toHaveBeenCalled();
    });

    it('reports nothing after being stopped', async () => {
      const { startPostHog, stopPostHog, captureClientException } =
        await loadModule();

      await startPostHog('install-123');
      await stopPostHog();
      captureException.mockClear();

      captureClientException(new Error('boom'));

      expect(captureException).not.toHaveBeenCalled();
    });

    // Queued while the deployment's answer was still in flight, and the
    // answer was no.
    it('drops exceptions queued before analytics were disabled', async () => {
      const { captureClientException, stopPostHog, startPostHog } =
        await loadModule();

      captureClientException(new Error('boom'));
      await stopPostHog();
      await startPostHog('install-123');

      expect(captureException).not.toHaveBeenCalled();
    });
  });

  describe('captureClientEvent', () => {
    it('queues events raised before analytics started, like exceptions', async () => {
      const { captureClientEvent, startPostHog } = await loadModule();

      captureClientEvent('ProtocolInstalled', { schemaVersion: 8 });
      expect(capture).not.toHaveBeenCalled();

      await startPostHog('install-123');

      expect(capture).toHaveBeenCalledWith('ProtocolInstalled', {
        schemaVersion: 8,
      });
    });

    it('drops events when analytics are disabled', async () => {
      const { captureClientEvent, stopPostHog, startPostHog } =
        await loadModule();

      await stopPostHog();
      captureClientEvent('ProtocolInstalled');
      await startPostHog('install-123');

      expect(capture).not.toHaveBeenCalled();
    });
  });

  describe('captureClientException', () => {
    // The error boundaries render before analytics start, and posthog-js
    // treats capture before init() as a silent no-op.
    it('replays exceptions raised before analytics started', async () => {
      const { captureClientException, startPostHog } = await loadModule();
      const error = new Error('boom');

      captureClientException(error);
      expect(captureException).not.toHaveBeenCalled();

      await startPostHog('install-123');

      expect(captureException).toHaveBeenCalledWith(error);
    });

    // captureClientException attaches to the same promise startPostHog is
    // waiting on, and would otherwise win the race and report before the
    // opt-in and identify that make the report count.
    it('waits for opt-in and identify, not just for the client', async () => {
      const { captureClientException, startPostHog } = await loadModule();

      const starting = startPostHog('install-123');
      captureClientException(new Error('boom'));
      await starting;

      expect(captureException).toHaveBeenCalledOnce();
      expect(calls).toEqual([
        'init',
        'register',
        'opt_in_capturing',
        'register',
      ]);
      expect(identify).toHaveBeenCalledBefore(captureException);
    });

    it('captures immediately once analytics have started', async () => {
      const { captureClientException, startPostHog } = await loadModule();
      await startPostHog('install-123');
      const error = new Error('boom');

      captureClientException(error);
      await vi.waitFor(() =>
        expect(captureException).toHaveBeenCalledWith(error),
      );
    });

    it('drops exceptions when analytics never start, and never loads PostHog', async () => {
      const { captureClientException } = await loadModule();

      captureClientException(new Error('boom'));

      expect(init).not.toHaveBeenCalled();
      expect(captureException).not.toHaveBeenCalled();
    });

    it('bounds the queue when analytics never start', async () => {
      const { captureClientException, startPostHog } = await loadModule();

      for (let i = 0; i < 25; i++) {
        captureClientException(new Error(`boom ${i}`));
      }
      await startPostHog('install-123');

      expect(captureException).toHaveBeenCalledTimes(10);
    });
  });

  it('never throws when PostHog fails to start', async () => {
    init.mockImplementationOnce(() => {
      throw new Error('chunk failed to load');
    });
    const { startPostHog } = await loadModule();

    await expect(startPostHog('install-123')).resolves.toBeUndefined();
    expect(register).not.toHaveBeenCalled();
  });

  it('initialises once however many times it is started', async () => {
    const { startPostHog } = await loadModule();

    await startPostHog('install-123');
    await startPostHog('install-123');

    expect(init).toHaveBeenCalledOnce();
    // Opting in, unlike init, is repeated on purpose: it is what clears a
    // stored opt-out this deployment wrote while analytics were off.
    expect(optInCapturing).toHaveBeenCalledTimes(2);
  });

  describe('participant privacy', () => {
    const INTERVIEW_ID = 'clh3k4j5k0000abcdefghijkl';

    /** The config posthog-js was initialised with. */
    function initConfig() {
      const call = init.mock.calls[0];
      if (!call) throw new Error('PostHog was never initialised');

      return call[1];
    }

    beforeEach(() => {
      window.history.pushState({}, '', '/');
    });

    // posthog-js attaches the current URL to everything it captures, and on a
    // participant's page that URL is their access credential.
    it('redacts participant links from every event before it is sent', async () => {
      const { startPostHog } = await loadModule();
      await startPostHog('install-123');

      const beforeSend = initConfig().before_send;
      if (typeof beforeSend !== 'function') {
        throw new TypeError('before_send was not configured');
      }

      expect(
        beforeSend({
          event: '$pageview',
          properties: {
            $current_url: `https://fresco.example.org/interview/${INTERVIEW_ID}`,
          },
        }),
      ).toEqual(
        expect.objectContaining({
          properties: {
            $current_url: 'https://fresco.example.org/interview/[redacted]',
          },
        }),
      );
    });

    it('passes a dropped event through untouched', async () => {
      const { startPostHog } = await loadModule();
      await startPostHog('install-123');

      const beforeSend = initConfig().before_send;
      if (typeof beforeSend !== 'function') {
        throw new TypeError('before_send was not configured');
      }

      expect(beforeSend(null)).toBeNull();
    });

    // Replay writes the page's own URL into its payload, where before_send
    // cannot reach it — and a recording of someone answering interview
    // questions is research data, not telemetry.
    it('never records a session that starts on a participant page', async () => {
      window.history.pushState({}, '', `/interview/${INTERVIEW_ID}`);
      const { startPostHog } = await loadModule();

      await startPostHog('install-123');

      expect(initConfig().disable_session_recording).toBe(true);
    });

    it('leaves recording alone on researcher pages', async () => {
      window.history.pushState({}, '', '/dashboard/interviews');
      const { startPostHog } = await loadModule();

      await startPostHog('install-123');

      expect(initConfig().disable_session_recording).toBe(false);
    });

    // A researcher opening an interview from the dashboard gets there by
    // client-side navigation, so posthog-js never re-initialises and the
    // decision above was already made on a page where recording was allowed.
    // Called whatever the current state, and deliberately without consulting
    // sessionRecordingStarted. The replay extension loads lazily, so "not
    // recording yet" is not "not going to record" — and stopSessionRecording
    // also sets disable_session_recording, which is the half that stops it
    // starting a moment later.
    it.each([true, false])(
      'stops replay when a recording has started: %s',
      async (recording) => {
        sessionRecordingStarted.mockReturnValue(recording);
        const { startPostHog, stopSessionRecording: stop } = await loadModule();
        await startPostHog('install-123');

        await stop();

        expect(stopSessionRecording).toHaveBeenCalled();
      },
    );

    it('never loads PostHog just to stop recording', async () => {
      const { stopSessionRecording: stop } = await loadModule();

      await stop();

      expect(init).not.toHaveBeenCalled();
    });
  });
});
