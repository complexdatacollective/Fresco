type InterviewSyncedMessage = {
  type: 'INTERVIEW_SYNCED';
  tempId: string;
  realId: string;
};

type InterviewUpdatedMessage = {
  type: 'INTERVIEW_UPDATED';
  id: string;
};

type ProtocolCachedMessage = {
  type: 'PROTOCOL_CACHED';
  id: string;
};

export type TabSyncMessage =
  | InterviewSyncedMessage
  | InterviewUpdatedMessage
  | ProtocolCachedMessage;

let channel: BroadcastChannel | null = null;

const getChannel = (): BroadcastChannel | null => {
  if (
    typeof window === 'undefined' ||
    typeof BroadcastChannel === 'undefined'
  ) {
    return null;
  }
  channel ??= new BroadcastChannel('fresco-offline-sync');
  return channel;
};

export const postMessage = (message: TabSyncMessage): void => {
  const ch = getChannel();
  if (!ch) {
    return;
  }
  try {
    ch.postMessage(message);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to post message to BroadcastChannel:', error);
  }
};

export const addMessageListener = (
  listener: (message: TabSyncMessage) => void,
): (() => void) => {
  const ch = getChannel();
  if (!ch) {
    // Return no-op cleanup when BroadcastChannel is unavailable (SSR or unsupported browser)
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    return () => {};
  }

  const handler = (event: MessageEvent<TabSyncMessage>) => {
    listener(event.data);
  };

  ch.addEventListener('message', handler);

  return () => {
    ch.removeEventListener('message', handler);
  };
};

export const closeChannel = (): void => {
  if (channel) {
    channel.close();
    channel = null;
  }
};
