import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { SessionPayload, SyncOptions } from '@codaco/interview/contract';

import { createInterviewSyncHandler } from '../createInterviewSyncHandler';

const ORDINARY: SyncOptions = { immediate: false, unloading: false };
const UNLOADING: SyncOptions = { immediate: true, unloading: true };

// Mirrors the route's own window. Kept as a literal rather than imported so a
// change to the route has to be reflected here deliberately.
const MAX_REVISION_ADVANCE = 10_000;

/**
 * Watch a write's outcome from the moment it is issued. Attaching later would
 * let a rejection surface as an unhandled one and fail the whole run.
 */
function settle(write: Promise<void>) {
  return write.then(
    () => 'fulfilled' as const,
    () => 'rejected' as const,
  );
}

function sessionWith(name: string): SessionPayload {
  return {
    id: 'interview-1',
    startTime: '2026-08-12T00:00:00.000Z',
    finishTime: null,
    exportTime: null,
    lastUpdated: '2026-08-12T00:00:00.000Z',
    network: {
      nodes: [{ _uid: 'node-1', type: 'person', attributes: { name } }],
      edges: [],
      ego: { _uid: 'ego-1', attributes: {} },
    },
  };
}

type SyncBody = { network: SessionPayload['network']; syncRevision?: number };

/**
 * The endpoint's own rule, so these tests measure what the participant's
 * answers end up as rather than what the handler happened to send. A write that
 * does not beat the stored revision, or jumps implausibly far past it, is
 * discarded exactly as the real route discards it.
 */
function makeServer(initialRevision = 0) {
  const state = {
    revision: initialRevision,
    network: sessionWith('nothing yet').network,
    writes: 0,
  };

  const apply = (body: SyncBody) => {
    const incoming = body.syncRevision;
    if (
      incoming === undefined ||
      incoming <= state.revision ||
      incoming - MAX_REVISION_ADVANCE > state.revision
    ) {
      return { success: true, applied: false, syncRevision: state.revision };
    }
    state.writes += 1;
    state.network = body.network;
    state.revision = incoming;
    return { success: true, applied: true, syncRevision: state.revision };
  };

  return { state, apply };
}

/**
 * A fetch stub whose responses are released by the test, one at a time.
 *
 * `honourAbort: false` delivers a response to a request the handler cancelled.
 * That models what cancelling actually buys: the abort is an optimisation, and
 * a server that has already started — or finished — the write answers anyway.
 * Tests of what the handler does with a discarded response need it, because
 * with the abort honoured that write rejects before it can read one.
 */
function makeFetch(
  apply: (body: SyncBody) => unknown,
  { honourAbort = true }: { honourAbort?: boolean } = {},
) {
  const releases: (() => void)[] = [];
  const bodies: SyncBody[] = [];

  const fetchMock = vi.fn(
    (_url: string, init: { body: string; signal?: AbortSignal }) => {
      const body = JSON.parse(init.body) as SyncBody;
      bodies.push(body);

      return new Promise((resolve, reject) => {
        if (honourAbort) {
          init.signal?.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'));
          });
        }
        releases.push(() => {
          const result = apply(body);
          resolve({
            ok: true,
            json: () => Promise.resolve(result),
          });
        });
      });
    },
  );

  return {
    fetchMock,
    bodies,
    /** Settle the nth request that was issued (0-indexed). */
    release: (index: number) => {
      const release = releases[index];
      if (!release) throw new Error(`No request at index ${index}`);
      release();
    },
  };
}

/** Responses that settle on their own, for tests not staging a race. */
function makeAutoFetch(apply: (body: SyncBody) => unknown) {
  const bodies: SyncBody[] = [];

  const fetchMock = vi.fn((_url: string, init: { body: string }) => {
    const body = JSON.parse(init.body) as SyncBody;
    bodies.push(body);
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(apply(body)),
    });
  });

  return { fetchMock, bodies };
}

describe('createInterviewSyncHandler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('keeps the newest answers when an unloading write overtakes the one before it', async () => {
    // The bug this guards: an `unloading` write is issued rather than queued,
    // so it can be on the wire beside an ordinary write and the two can finish
    // in either order. Aborting the ordinary request client-side does not stop
    // a handler the server has already started, so the older snapshot could be
    // committed last and discard the participant's most recent answers.
    const { state, apply } = makeServer();
    const { fetchMock, bodies, release } = makeFetch(apply);
    vi.stubGlobal('fetch', fetchMock);

    const onSync = createInterviewSyncHandler({
      interviewId: 'interview-1',
      initialSyncRevision: 0,
      getCurrentStep: () => 2,
    });

    // An ordinary write goes out and stays on the wire. Track its outcome now:
    // the write it is about to be superseded by aborts it, and a rejection
    // nobody is watching yet fails the run as an unhandled one.
    const ordinary = settle(
      onSync('interview-1', sessionWith('older'), ORDINARY),
    );
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // The tab is hidden. This write does not wait for the one in front of it.
    const unloading = settle(
      onSync('interview-1', sessionWith('newer'), UNLOADING),
    );
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    // The newer one is handled first, then the older one it overtook.
    release(1);
    await vi.advanceTimersByTimeAsync(0);
    release(0);

    // Numbered in the order they were issued, whatever order they land in.
    expect(bodies.map((body) => body.syncRevision)).toEqual([1, 2]);
    expect(state.network).toEqual(sessionWith('newer').network);
    // Only the newer snapshot was ever committed.
    expect(state.writes).toBe(1);

    await expect(unloading).resolves.toBe('fulfilled');
    // The abort is what the superseded write reports; the engine logs it and
    // re-offers the live state. Ordering is not what that rejection buys — the
    // route discards the write regardless of whether it is cancelled in time.
    await expect(ordinary).resolves.toBe('rejected');
  });

  it('does not rewrite a snapshot a newer write of its own already superseded', async () => {
    // The retry must never fire for a write this handler itself overtook:
    // rewriting that snapshot is precisely the rollback the revision exists to
    // prevent. Cancelling usually hides this case, so this test takes the
    // cancel away — which is the situation the guard is for, since cancelling
    // is an optimisation and the server answers a request it already handled.
    const { state, apply } = makeServer();
    const { fetchMock, bodies, release } = makeFetch(apply, {
      honourAbort: false,
    });
    vi.stubGlobal('fetch', fetchMock);

    const onSync = createInterviewSyncHandler({
      interviewId: 'interview-1',
      initialSyncRevision: 0,
      getCurrentStep: () => 0,
    });

    const ordinary = settle(
      onSync('interview-1', sessionWith('older'), ORDINARY),
    );
    await vi.advanceTimersByTimeAsync(0);
    const unloading = settle(
      onSync('interview-1', sessionWith('newer'), UNLOADING),
    );
    await vi.advanceTimersByTimeAsync(0);

    // The newer one commits; the older one is then told it was discarded.
    release(1);
    await vi.advanceTimersByTimeAsync(0);
    release(0);
    await vi.advanceTimersByTimeAsync(0);

    // No third request: the discarded write was left alone, because a newer
    // write of this handler's own already carries that state. Asserted before
    // awaiting the writes, so a handler that does retry fails here rather than
    // hanging on a request this test never releases.
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(bodies.map((body) => body.syncRevision)).toEqual([1, 2]);
    expect(state.network).toEqual(sessionWith('newer').network);
    expect(state.writes).toBe(1);

    await expect(ordinary).resolves.toBe('fulfilled');
    await expect(unloading).resolves.toBe('fulfilled');
  });

  it('numbers writes upwards from the revision the row already holds', async () => {
    // A reloaded tab starting again at one would have every write it made
    // treated as older than what is stored, and discarded.
    const { state, apply } = makeServer(41);
    const { fetchMock, bodies } = makeAutoFetch(apply);
    vi.stubGlobal('fetch', fetchMock);

    const onSync = createInterviewSyncHandler({
      interviewId: 'interview-1',
      initialSyncRevision: 41,
      getCurrentStep: () => 0,
    });

    await onSync('interview-1', sessionWith('resumed'), ORDINARY);

    expect(bodies[0]?.syncRevision).toBe(42);
    expect(state.network).toEqual(sessionWith('resumed').network);
  });

  it('rewrites the snapshot when another tab moved the row, rather than reporting it saved', async () => {
    // A second tab seeds its counter when it loads, so the tab that has been
    // writing since is ahead of it. Resolving the discarded write would mark
    // the snapshot durable in the engine, which then stops offering it — if the
    // participant answers nothing else, answers that never reached the server
    // are recorded as saved.
    const { state, apply } = makeServer();
    const { fetchMock, bodies } = makeAutoFetch(apply);
    vi.stubGlobal('fetch', fetchMock);

    const onSync = createInterviewSyncHandler({
      interviewId: 'interview-1',
      initialSyncRevision: 0,
      getCurrentStep: () => 0,
    });

    // The other tab has written several times since this one loaded.
    state.revision = 20;

    await onSync('interview-1', sessionWith('mine'), ORDINARY);

    // Discarded at 1, retried from what the row reported, and stored.
    expect(bodies.map((body) => body.syncRevision)).toEqual([1, 21]);
    expect(state.network).toEqual(sessionWith('mine').network);
  });

  it('reports a failure when the retry is overtaken too, instead of claiming the write landed', async () => {
    // Two tabs moving the row faster than either can follow. Retrying further
    // would be a write storm; the engine is told the state is not durable and
    // offers it again on the next change.
    const { state, apply } = makeServer();
    const { fetchMock } = makeAutoFetch((body) => {
      const result = apply(body);
      // Something else advances the row between this write and its retry.
      state.revision += 50;
      return result;
    });
    vi.stubGlobal('fetch', fetchMock);

    const onSync = createInterviewSyncHandler({
      interviewId: 'interview-1',
      initialSyncRevision: 0,
      getCurrentStep: () => 0,
    });

    state.revision = 20;

    await expect(
      onSync('interview-1', sessionWith('mine'), ORDINARY),
    ).rejects.toThrow(/superseded/);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('recovers when its counter has drifted past the endpoint’s advance window', async () => {
    // Writes that never land still burn numbers, so a counter can end up far
    // enough ahead of the row that the endpoint refuses the jump. The retry is
    // numbered from the stored revision, which brings it back inside.
    const { state, apply } = makeServer();
    const { fetchMock, bodies } = makeAutoFetch(apply);
    vi.stubGlobal('fetch', fetchMock);

    const drifted = MAX_REVISION_ADVANCE + 500;
    const onSync = createInterviewSyncHandler({
      interviewId: 'interview-1',
      initialSyncRevision: drifted,
      getCurrentStep: () => 0,
    });

    await onSync('interview-1', sessionWith('drifted'), ORDINARY);

    expect(bodies.map((body) => body.syncRevision)).toEqual([drifted + 1, 1]);
    expect(state.network).toEqual(sessionWith('drifted').network);
    expect(state.revision).toBe(1);
  });

  it('does not retry against a frozen interview, which will never accept a write', async () => {
    // Freezing declines every write permanently. Reading that as a lost race
    // would double every request and then report a failure the engine logs on
    // repeat — for an interview that is over and already holds its final state.
    const frozen = vi.fn(() => ({
      success: true,
      applied: false,
      frozen: true,
      syncRevision: 4,
    }));
    const { fetchMock } = makeAutoFetch(frozen);
    vi.stubGlobal('fetch', fetchMock);

    const onSync = createInterviewSyncHandler({
      interviewId: 'interview-1',
      initialSyncRevision: 4,
      getCurrentStep: () => 0,
    });

    await onSync('interview-1', sessionWith('after-finish'), ORDINARY);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('batches ordinary changes and writes the newest of them', async () => {
    const { apply } = makeServer();
    const { fetchMock, bodies } = makeAutoFetch(apply);
    vi.stubGlobal('fetch', fetchMock);

    const onSync = createInterviewSyncHandler({
      interviewId: 'interview-1',
      initialSyncRevision: 0,
      getCurrentStep: () => 0,
    });

    await onSync('interview-1', sessionWith('first'), ORDINARY);

    // Inside the rate-limit window these are held, not written one for one.
    void onSync('interview-1', sessionWith('second'), ORDINARY);
    void onSync('interview-1', sessionWith('third'), ORDINARY);
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(3000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(bodies[1]?.network).toEqual(sessionWith('third').network);
    expect(bodies[1]?.syncRevision).toBe(2);
  });

  it('refuses a sync for an interview it does not belong to', async () => {
    const { apply } = makeServer();
    const { fetchMock } = makeAutoFetch(apply);
    vi.stubGlobal('fetch', fetchMock);

    const onSync = createInterviewSyncHandler({
      interviewId: 'interview-1',
      initialSyncRevision: 0,
      getCurrentStep: () => 0,
    });

    await expect(
      onSync('interview-2', sessionWith('stray'), ORDINARY),
    ).rejects.toThrow(/interview-2.+interview-1/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
