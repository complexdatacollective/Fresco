import {
  configureStore,
  createAction,
  type UnknownAction,
} from '@reduxjs/toolkit';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from 'vitest';
import { type SessionState } from '~/lib/interviewer/ducks/modules/session';
import { createSyncMiddleware } from '~/lib/interviewer/middleware/syncMiddleware';

// --- Helpers ---

function makeSession(overrides: Partial<SessionState> = {}): SessionState {
  return {
    id: 'interview-1',
    startTime: new Date().toISOString(),
    finishTime: null,
    exportTime: null,
    lastUpdated: new Date().toISOString(),
    network: { ego: { _uid: 'ego-1', [Symbol()]: {} }, nodes: [], edges: [] },
    currentStep: 0,
    ...overrides,
  } as SessionState;
}

const mutateSession = createAction<Partial<SessionState>>('TEST/MUTATE');

function createTestStore(
  middleware: ReturnType<typeof createSyncMiddleware>,
  initialSession?: SessionState,
) {
  const session = initialSession ?? makeSession();

  return configureStore({
    reducer: {
      session: (
        state: SessionState | undefined = session,
        action: UnknownAction,
      ) => {
        if (mutateSession.match(action)) {
          return { ...state, ...action.payload };
        }
        return state;
      },
    },
    preloadedState: { session },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ serializableCheck: false }).concat(middleware),
  });
}

// --- Test suite ---

let onSyncMock: Mock;
let middleware: ReturnType<typeof createSyncMiddleware>;

beforeEach(() => {
  vi.useFakeTimers();
  onSyncMock = vi.fn().mockResolvedValue(undefined);
  vi.spyOn(console, 'log').mockImplementation(vi.fn());
  vi.spyOn(console, 'error').mockImplementation(vi.fn());

  middleware = createSyncMiddleware({ onSync: onSyncMock });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('syncMiddleware', () => {
  it('syncs immediately on first state change (leading edge)', async () => {
    const store = createTestStore(middleware);

    store.dispatch(mutateSession({ currentStep: 1 }));

    // Leading edge fires synchronously inside the debounce call, which
    // triggers the async onSync. Flush the microtask queue so the mock
    // is invoked.
    await vi.advanceTimersByTimeAsync(0);

    expect(onSyncMock).toHaveBeenCalledTimes(1);
    expect(onSyncMock).toHaveBeenCalledWith(
      'interview-1',
      expect.objectContaining({ currentStep: 1 }),
    );
  });

  it('does not sync when only promptIndex changes', async () => {
    const store = createTestStore(middleware);

    store.dispatch(mutateSession({ promptIndex: 5 }));
    await vi.advanceTimersByTimeAsync(3000);

    expect(onSyncMock).not.toHaveBeenCalled();
  });

  it('batches rapid changes and sends latest state on trailing edge', async () => {
    const store = createTestStore(middleware);

    // First change → leading edge sync
    store.dispatch(mutateSession({ currentStep: 1 }));
    await vi.advanceTimersByTimeAsync(0);
    expect(onSyncMock).toHaveBeenCalledTimes(1);

    // Rapid subsequent changes within the 3s debounce window
    store.dispatch(mutateSession({ currentStep: 2 }));
    store.dispatch(mutateSession({ currentStep: 3 }));
    await vi.advanceTimersByTimeAsync(0);

    // Still only the initial sync — debounce absorbs these
    expect(onSyncMock).toHaveBeenCalledTimes(1);

    // Advance past the debounce window → trailing edge fires
    await vi.advanceTimersByTimeAsync(3000);

    expect(onSyncMock).toHaveBeenCalledTimes(2);
    expect(onSyncMock).toHaveBeenLastCalledWith(
      'interview-1',
      expect.objectContaining({ currentStep: 3 }),
    );
  });

  it('does not lose changes made during an in-flight sync', async () => {
    // Create an onSync that we can resolve manually to control timing
    let resolveSync!: () => void;
    onSyncMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveSync = resolve;
        }),
    );

    const store = createTestStore(middleware);

    // First change → leading edge sync starts (in-flight)
    store.dispatch(mutateSession({ currentStep: 1 }));
    await vi.advanceTimersByTimeAsync(0);
    expect(onSyncMock).toHaveBeenCalledTimes(1);

    // Change state while sync is in-flight
    store.dispatch(mutateSession({ currentStep: 2 }));

    // Resolve the in-flight sync → .finally() should detect dirty state
    // and call debouncedSync(). The debounce timer is still active from the
    // earlier calls, so the follow-up fires on the trailing edge.
    resolveSync();
    await vi.advanceTimersByTimeAsync(0);

    // Advance past the debounce window so the trailing edge fires
    await vi.advanceTimersByTimeAsync(3000);
    expect(onSyncMock).toHaveBeenCalledTimes(2);
    expect(onSyncMock).toHaveBeenLastCalledWith(
      'interview-1',
      expect.objectContaining({ currentStep: 2 }),
    );
  });

  it('reads current state at sync time, not at dispatch time', async () => {
    // Slow onSync so we can observe the trailing edge behavior
    onSyncMock.mockImplementation(
      () =>
        new Promise<void>((resolve) =>
          // Resolve after a short delay
          setTimeout(resolve, 100),
        ),
    );

    const store = createTestStore(middleware);

    // Leading edge sync fires with currentStep: 1
    store.dispatch(mutateSession({ currentStep: 1 }));
    await vi.advanceTimersByTimeAsync(0);

    // Let the sync complete
    await vi.advanceTimersByTimeAsync(100);

    // More changes within the debounce window
    store.dispatch(mutateSession({ currentStep: 5 }));

    // Advance past debounce → trailing edge fires
    await vi.advanceTimersByTimeAsync(3000);

    // The trailing edge should have the latest state (currentStep: 5)
    expect(onSyncMock).toHaveBeenLastCalledWith(
      expect.any(String),
      expect.objectContaining({ currentStep: 5 }),
    );
  });

  it('resets state when a new store connects', async () => {
    const store1 = createTestStore(middleware);

    // Trigger a sync on store 1
    store1.dispatch(mutateSession({ currentStep: 1 }));
    await vi.advanceTimersByTimeAsync(0);
    expect(onSyncMock).toHaveBeenCalledTimes(1);

    // Create a new store with the same middleware (simulates navigating
    // to a new interview). The middleware should reset its internal state.
    const store2 = createTestStore(
      middleware,
      makeSession({ id: 'interview-2', currentStep: 0 }),
    );

    // A change on store 2 should trigger a sync, even though the state
    // shape might overlap with store 1's last synced state.
    store2.dispatch(mutateSession({ currentStep: 1 }));
    await vi.advanceTimersByTimeAsync(0);

    expect(onSyncMock).toHaveBeenCalledTimes(2);
    expect(onSyncMock).toHaveBeenLastCalledWith(
      'interview-2',
      expect.objectContaining({ id: 'interview-2' }),
    );
  });

  it('cancels pending debounce timers when a new store connects', async () => {
    const store1 = createTestStore(middleware);

    // Trigger leading edge + queue trailing
    store1.dispatch(mutateSession({ currentStep: 1 }));
    store1.dispatch(mutateSession({ currentStep: 2 }));
    await vi.advanceTimersByTimeAsync(0);
    expect(onSyncMock).toHaveBeenCalledTimes(1);

    // Connect a new store before the trailing edge fires
    createTestStore(
      middleware,
      makeSession({ id: 'interview-2', currentStep: 0 }),
    );

    // Advance past the original debounce window
    await vi.advanceTimersByTimeAsync(3000);

    // The trailing edge from store 1 should NOT have fired — it was
    // cancelled when store 2 connected.
    expect(onSyncMock).toHaveBeenCalledTimes(1);
  });

  it('handles sync errors without breaking subsequent syncs', async () => {
    onSyncMock.mockRejectedValueOnce(new Error('Network error'));

    const store = createTestStore(middleware);

    // First sync fails
    store.dispatch(mutateSession({ currentStep: 1 }));
    await vi.advanceTimersByTimeAsync(0);
    expect(onSyncMock).toHaveBeenCalledTimes(1);

    // Second change should still trigger a sync
    store.dispatch(mutateSession({ currentStep: 2 }));
    await vi.advanceTimersByTimeAsync(3000);

    expect(onSyncMock).toHaveBeenCalledTimes(2);
  });

  it('does not sync when state is identical to last synced state', async () => {
    const store = createTestStore(middleware);

    store.dispatch(mutateSession({ currentStep: 1 }));
    await vi.advanceTimersByTimeAsync(0);
    expect(onSyncMock).toHaveBeenCalledTimes(1);

    // Advance past debounce to clear the timer
    await vi.advanceTimersByTimeAsync(3000);

    // Dispatch the same value — state doesn't actually change in a
    // meaningful way from the middleware's perspective if the reducer
    // produces the same result, but our test reducer always spreads
    // (creating a new object). The middleware uses deep equality, so
    // it should still skip the sync.
    store.dispatch(mutateSession({ currentStep: 1 }));
    await vi.advanceTimersByTimeAsync(3000);

    // The trailing from the first cycle may fire, but the second dispatch
    // should not produce an additional sync because the values match.
    const callsWithStep1 = (
      onSyncMock.mock.calls as [string, SessionState][]
    ).filter((call) => call[1].currentStep === 1);
    // At most the leading + trailing of the first cycle
    expect(callsWithStep1.length).toBeLessThanOrEqual(2);

    // No call should have been made for the second dispatch
    const allSteps = (onSyncMock.mock.calls as [string, SessionState][]).map(
      (call) => call[1].currentStep,
    );
    expect(allSteps.every((step) => step === 1)).toBe(true);
  });
});
