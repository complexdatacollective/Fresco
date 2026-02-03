import { createId } from '@paralleldrive/cuid2';
import { type NcNetwork } from '@codaco/shared-consts';
import { createInitialNetwork } from '~/lib/interviewer/ducks/modules/session';
import { offlineDb, logOfflineError, withErrorHandling } from './db';

type ProtocolData = {
  id: string;
  name: string;
  codebook: unknown;
  stages: unknown[];
};

export type OfflineInterviewData = {
  id: string;
  protocolId: string;
  participantId: string;
  participantIdentifier: string;
  network: NcNetwork;
  currentStep: number;
  startTime: number;
  finishTime: number | null;
};

export const createOfflineInterview = async (
  protocolId: string,
  participantIdentifier?: string,
): Promise<{ interviewId: string; error: string | null }> => {
  return withErrorHandling('createOfflineInterview', async () => {
    const protocol = await offlineDb.protocols.get(protocolId);

    if (!protocol) {
      return {
        interviewId: '',
        error: 'Protocol not available offline. Please download it first.',
      };
    }

    const interviewId = `offline-${createId()}`;
    const participantId = `p-${createId()}`;
    const identifier = participantIdentifier ?? participantId;

    const interviewData: OfflineInterviewData = {
      id: interviewId,
      protocolId,
      participantId,
      participantIdentifier: identifier,
      network: createInitialNetwork(),
      currentStep: 0,
      startTime: Date.now(),
      finishTime: null,
    };

    await offlineDb.interviews.add({
      id: interviewId,
      protocolId,
      syncStatus: 'pending',
      lastUpdated: Date.now(),
      isOfflineCreated: true,
      data: JSON.stringify(interviewData),
    });

    await offlineDb.syncQueue.add({
      interviewId,
      operation: 'create',
      createdAt: Date.now(),
      payload: JSON.stringify({
        protocolId,
        participantIdentifier: identifier,
      }),
    });

    return { interviewId, error: null };
  }).catch(async (error) => {
    await logOfflineError('createOfflineInterview', error);
    return {
      interviewId: '',
      error:
        error instanceof Error ? error.message : 'Failed to create interview',
    };
  });
};

export const getOfflineInterviewData = async (
  interviewId: string,
): Promise<OfflineInterviewData | null> => {
  const interview = await offlineDb.interviews.get(interviewId);

  if (!interview) {
    return null;
  }

  return JSON.parse(interview.data) as OfflineInterviewData;
};

export const updateOfflineInterview = async (
  interviewId: string,
  updates: Partial<OfflineInterviewData>,
): Promise<void> => {
  return withErrorHandling('updateOfflineInterview', async () => {
    const interview = await offlineDb.interviews.get(interviewId);

    if (!interview) {
      throw new Error('Interview not found');
    }

    const currentData = JSON.parse(interview.data) as OfflineInterviewData;
    const updatedData = { ...currentData, ...updates };

    await offlineDb.interviews.update(interviewId, {
      lastUpdated: Date.now(),
      syncStatus: 'pending',
      data: JSON.stringify(updatedData),
    });

    await offlineDb.syncQueue.add({
      interviewId,
      operation: 'update',
      createdAt: Date.now(),
      payload: JSON.stringify(updates),
    });
  });
};

export const getCachedProtocolData = async (
  protocolId: string,
): Promise<ProtocolData | null> => {
  const protocol = await offlineDb.protocols.get(protocolId);

  if (!protocol) {
    return null;
  }

  return JSON.parse(protocol.data) as ProtocolData;
};

export const listCachedProtocols = async (): Promise<
  { id: string; name: string; cachedAt: number }[]
> => {
  const protocols = await offlineDb.protocols.toArray();
  return protocols.map((p) => ({
    id: p.id,
    name: p.name,
    cachedAt: p.cachedAt,
  }));
};

export const listOfflineInterviews = async (): Promise<
  { id: string; protocolId: string; syncStatus: string; lastUpdated: number }[]
> => {
  const interviews = await offlineDb.interviews.toArray();
  return interviews.map((i) => ({
    id: i.id,
    protocolId: i.protocolId,
    syncStatus: i.syncStatus,
    lastUpdated: i.lastUpdated,
  }));
};
