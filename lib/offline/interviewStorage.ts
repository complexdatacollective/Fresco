import { createId } from '@paralleldrive/cuid2';
import { type SessionState } from '~/lib/interviewer/ducks/modules/session';
import { ensureError } from '~/utils/ensureError';
import { offlineDb } from './db';
import { postMessage } from './tabSync';

export const hydrateInterviewFromIndexedDB = async (
  interviewId: string,
): Promise<SessionState | null> => {
  try {
    const storedInterview = await offlineDb.interviews.get(interviewId);

    if (!storedInterview) {
      return null;
    }

    const sessionState = JSON.parse(storedInterview.data) as SessionState;
    return sessionState;
  } catch (e) {
    const error = ensureError(e);
    // eslint-disable-next-line no-console
    console.error('Failed to hydrate interview from IndexedDB:', error);
    return null;
  }
};

export const createOfflineInterview = async (
  protocolId: string,
  sessionState: SessionState,
): Promise<string> => {
  try {
    const tempId = `temp-${createId()}`;

    const serializedState = JSON.stringify(sessionState);

    await offlineDb.interviews.put({
      id: tempId,
      protocolId,
      syncStatus: 'pending',
      lastUpdated: Date.now(),
      isOfflineCreated: true,
      data: serializedState,
    });

    await offlineDb.syncQueue.add({
      interviewId: tempId,
      operation: 'create',
      createdAt: Date.now(),
      payload: serializedState,
    });

    postMessage({
      type: 'INTERVIEW_UPDATED',
      id: tempId,
    });

    return tempId;
  } catch (e) {
    const error = ensureError(e);
    // eslint-disable-next-line no-console
    console.error('Failed to create offline interview:', error);
    throw error;
  }
};

export const checkProtocolCached = async (
  protocolId: string,
): Promise<boolean> => {
  try {
    const protocol = await offlineDb.protocols.get(protocolId);
    return !!protocol;
  } catch (e) {
    const error = ensureError(e);
    // eslint-disable-next-line no-console
    console.error('Failed to check if protocol is cached:', error);
    return false;
  }
};

export const getInterviewFromIndexedDB = async (
  interviewId: string,
): Promise<{ sessionState: SessionState; protocolId: string } | null> => {
  try {
    const storedInterview = await offlineDb.interviews.get(interviewId);

    if (!storedInterview) {
      return null;
    }

    const sessionState = JSON.parse(storedInterview.data) as SessionState;

    return {
      sessionState,
      protocolId: storedInterview.protocolId,
    };
  } catch (e) {
    const error = ensureError(e);
    // eslint-disable-next-line no-console
    console.error('Failed to get interview from IndexedDB:', error);
    return null;
  }
};
