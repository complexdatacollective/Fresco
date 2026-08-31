import {
  createDebouncedSyncHandler,
  type SessionPayload,
  type SyncHandler,
} from '@codaco/interview/contract';

// Matches the interval the interview engine used to apply on every host's
// behalf, so a participant's answers reach the server at the same rate as
// before batching became this host's decision.
const SYNC_DEBOUNCE_MS = 3000;

// The fetch spec caps the combined body size of all in-flight keepalive
// requests at 64KB and fails the request rather than truncating it. Stay under
// it with room to spare.
const KEEPALIVE_MAX_BYTES = 60_000;

type Args = {
  interviewId: string;
  /**
   * The `syncRevision` the interview row already holds, read when the page was
   * rendered. Numbering continues from here rather than from zero: a reloaded
   * tab that started again at one would have every write it made discarded as
   * older than what is stored.
   */
  initialSyncRevision: number;
  /** Reads the host's current step at the moment a write is put on the wire. */
  getCurrentStep: () => number;
};

/** What the sync route reports back about the write it was handed. */
type SyncOutcome = {
  /** False when the row kept what it had and this write was discarded. */
  applied: boolean | undefined;
  /** The revision the row holds now, if the response said. */
  stored: number | undefined;
  /** The interview is finished and frozen, so no write will ever be taken. */
  frozen: boolean;
};

async function readOutcome(response: Response): Promise<SyncOutcome> {
  // Reading the body must never fail the write, which the server has by now
  // already decided on. An unreadable body leaves both fields undefined, which
  // reads as applied — the safe assumption, since the alternative is rewriting
  // a snapshot the row may already hold something newer than.
  try {
    const result: unknown = await response.json();
    if (typeof result !== 'object' || result === null) {
      return { applied: undefined, stored: undefined, frozen: false };
    }
    const applied = 'applied' in result ? result.applied : undefined;
    const stored = 'syncRevision' in result ? result.syncRevision : undefined;
    return {
      applied: typeof applied === 'boolean' ? applied : undefined,
      stored: typeof stored === 'number' ? stored : undefined,
      frozen: 'frozen' in result && result.frozen === true,
    };
  } catch {
    return { applied: undefined, stored: undefined, frozen: false };
  }
}

/**
 * Build the sync handler Fresco hands to `<Shell>`.
 *
 * Every sync posts the whole network, so this host batches: the engine offers a
 * write per change, and taking all of them would put a request on the wire for
 * every answer. The wrapper still writes the first change straight away and
 * stops batching whenever the engine says the write cannot wait — the
 * participant exiting or finishing, or the tab being hidden.
 *
 * One handler belongs to one interview, because the wrapper holds a single
 * pending snapshot: a handler reused across two would let the second replace
 * the first while both sets of waiters were attached, resolving the first's
 * promise with a write that discarded its state.
 */
export function createInterviewSyncHandler({
  interviewId,
  initialSyncRevision,
  getCurrentStep,
}: Args): SyncHandler {
  let inFlight: AbortController | null = null;
  // Numbers the writes this browser issues, so the server can tell which of two
  // it is holding at once is the newer one: a write issued later always carries
  // a higher number than one issued before it, whatever order they then land in.
  let nextRevision = initialSyncRevision;
  // The highest number actually put on the wire. What separates "a newer write
  // of ours already covers this state" from "something that is not us moved the
  // row" — the same HTTP response, wanting opposite handling.
  let highestIssued = initialSyncRevision;

  const issue = () => {
    nextRevision += 1;
    highestIssued = nextRevision;
    return nextRevision;
  };

  const post = async (
    session: SessionPayload,
    revision: number,
    unloading: boolean,
  ): Promise<SyncOutcome> => {
    // Cancel any request still running. Ordinary writes are queued one behind
    // another, so the only thing that can still be here is an unloading write —
    // those are issued rather than queued, precisely so they cannot be trapped
    // behind a request dying with the document. That leaves it able to outlive
    // a newer write. The endpoint discards a write older than the one it
    // already has, so this is no longer what stops the rollback; it just saves
    // the server the work of receiving a request whose result is already
    // decided. Cancelling unconditionally covers both orders: a newer unloading
    // write superseding an ordinary one, and — when a hidden tab is reopened
    // before its keepalive POST resolves — an ordinary write superseding the
    // unloading one.
    inFlight?.abort();

    const controller = new AbortController();
    inFlight = controller;
    const body = JSON.stringify({
      ...session,
      currentStep: getCurrentStep(),
      syncRevision: revision,
    });

    try {
      const response = await fetch(`/interview/${interviewId}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        signal: controller.signal,
        // An unloading write is the last thing that happens before the document
        // goes away, and a normal request dies with the page. keepalive lets it
        // outlive the document, but the browser caps all keepalive bodies at
        // 64KB and rejects anything larger outright, which a large network
        // exceeds. Ask for it only when the body fits; a larger one falls back
        // to an ordinary request, which still survives the far more common case
        // of the tab merely being backgrounded rather than closed.
        keepalive: unloading && new Blob([body]).size <= KEEPALIVE_MAX_BYTES,
      });
      if (!response.ok) throw new Error('Sync failed');

      return await readOutcome(response);
    } finally {
      if (inFlight === controller) inFlight = null;
    }
  };

  return createDebouncedSyncHandler(
    async (id, session, { unloading }) => {
      if (id !== interviewId) {
        throw new Error(
          `Sync for interview ${id} reached the handler for ${interviewId}`,
        );
      }

      // Assigned synchronously, before anything can await: this is what ties
      // the numbering to issue order. The route requires it on every write.
      const mine = issue();
      const first = await post(session, mine, unloading);

      if (first.applied !== false) return;

      // The interview is finished and frozen, so no write will ever be taken.
      // Rewriting would be declined again and report a failure the engine logs
      // on every change afterwards.
      if (first.frozen) return;

      // The row kept what it had. Returning here would be a claim the engine
      // acts on: it marks the snapshot durable and stops offering it, so if the
      // participant answers nothing else, answers that never reached the server
      // would be recorded as saved.
      if (mine !== highestIssued) {
        // A newer write of ours has been issued since and carries this state
        // too. This is the ordinary case the revision exists for — the write
        // that lost its race — and rewriting the snapshot now is exactly the
        // rollback being guarded against.
        return;
      }

      if (first.stored === undefined) return;

      // Nothing of ours is newer, so something that is not us moved the row:
      // another tab on the same interview, writing since this one loaded.
      // Nothing of ours is in flight to violate the ordering, so number the
      // retry from what the row actually holds — which also brings a counter
      // that has drifted past the endpoint's advance window back inside it.
      nextRevision = first.stored;
      const second = await post(session, issue(), unloading);

      if (second.applied === false) {
        // Retried once and overtaken again: another writer is moving the row
        // faster than this one can follow, and retrying further would be a
        // write storm between two tabs. Report the failure rather than claim a
        // durability that was not achieved — the engine logs it and offers the
        // state again on the next change.
        throw new Error('Sync superseded by a concurrent write');
      }
    },
    { waitMs: SYNC_DEBOUNCE_MS },
  );
}
