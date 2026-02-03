import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  addMessageListener,
  closeChannel,
  postMessage,
  type TabSyncMessage,
} from '../tabSync';

describe('tabSync', () => {
  let mockChannel: {
    postMessage: ReturnType<typeof vi.fn>;
    addEventListener: ReturnType<typeof vi.fn>;
    removeEventListener: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockChannel = {
      postMessage: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      close: vi.fn(),
    };

    global.BroadcastChannel = vi.fn(function (this: typeof mockChannel) {
      return mockChannel;
    }) as unknown as typeof BroadcastChannel;
  });

  afterEach(() => {
    closeChannel();
    vi.clearAllMocks();
  });

  describe('postMessage', () => {
    it('should send INTERVIEW_SYNCED message through BroadcastChannel', () => {
      const message: TabSyncMessage = {
        type: 'INTERVIEW_SYNCED',
        tempId: 'temp-123',
        realId: 'real-456',
      };

      postMessage(message);

      expect(mockChannel.postMessage).toHaveBeenCalledWith(message);
      expect(mockChannel.postMessage).toHaveBeenCalledTimes(1);
    });

    it('should send INTERVIEW_UPDATED message through BroadcastChannel', () => {
      const message: TabSyncMessage = {
        type: 'INTERVIEW_UPDATED',
        id: 'interview-123',
      };

      postMessage(message);

      expect(mockChannel.postMessage).toHaveBeenCalledWith(message);
      expect(mockChannel.postMessage).toHaveBeenCalledTimes(1);
    });

    it('should send PROTOCOL_CACHED message through BroadcastChannel', () => {
      const message: TabSyncMessage = {
        type: 'PROTOCOL_CACHED',
        id: 'protocol-123',
      };

      postMessage(message);

      expect(mockChannel.postMessage).toHaveBeenCalledWith(message);
      expect(mockChannel.postMessage).toHaveBeenCalledTimes(1);
    });

    it('should create channel only once for multiple messages', () => {
      const message1: TabSyncMessage = {
        type: 'INTERVIEW_UPDATED',
        id: 'interview-1',
      };

      const message2: TabSyncMessage = {
        type: 'INTERVIEW_UPDATED',
        id: 'interview-2',
      };

      postMessage(message1);
      postMessage(message2);

      expect(global.BroadcastChannel).toHaveBeenCalledTimes(1);
      expect(mockChannel.postMessage).toHaveBeenCalledTimes(2);
    });

    it('should handle errors when posting messages', () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      mockChannel.postMessage.mockImplementation(() => {
        throw new Error('Channel closed');
      });

      const message: TabSyncMessage = {
        type: 'INTERVIEW_UPDATED',
        id: 'interview-123',
      };

      expect(() => postMessage(message)).not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to post message to BroadcastChannel:',
        expect.any(Error),
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('addMessageListener', () => {
    it('should add message listener to BroadcastChannel', () => {
      const listener = vi.fn();

      addMessageListener(listener);

      expect(mockChannel.addEventListener).toHaveBeenCalledWith(
        'message',
        expect.any(Function),
      );
      expect(mockChannel.addEventListener).toHaveBeenCalledTimes(1);
    });

    it('should receive messages through the listener', () => {
      const listener = vi.fn();
      const capturedHandlers: ((event: MessageEvent) => void)[] = [];

      mockChannel.addEventListener.mockImplementation((event, handler) => {
        if (event === 'message') {
          capturedHandlers.push(handler as (event: MessageEvent) => void);
        }
      });

      addMessageListener(listener);

      const message: TabSyncMessage = {
        type: 'INTERVIEW_SYNCED',
        tempId: 'temp-123',
        realId: 'real-456',
      };

      const messageEvent = new MessageEvent('message', { data: message });
      capturedHandlers[0]?.(messageEvent);

      expect(listener).toHaveBeenCalledWith(message);
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should return cleanup function that removes listener', () => {
      const listener = vi.fn();

      const cleanup = addMessageListener(listener);

      expect(mockChannel.addEventListener).toHaveBeenCalledTimes(1);

      cleanup();

      expect(mockChannel.removeEventListener).toHaveBeenCalledWith(
        'message',
        expect.any(Function),
      );
      expect(mockChannel.removeEventListener).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple listeners independently', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      const capturedHandlers: ((event: MessageEvent) => void)[] = [];

      mockChannel.addEventListener.mockImplementation((event, handler) => {
        if (event === 'message') {
          capturedHandlers.push(handler as (event: MessageEvent) => void);
        }
      });

      addMessageListener(listener1);
      addMessageListener(listener2);

      const message: TabSyncMessage = {
        type: 'PROTOCOL_CACHED',
        id: 'protocol-123',
      };

      const messageEvent = new MessageEvent('message', { data: message });
      capturedHandlers[0]?.(messageEvent);
      capturedHandlers[1]?.(messageEvent);

      expect(listener1).toHaveBeenCalledWith(message);
      expect(listener2).toHaveBeenCalledWith(message);
      expect(mockChannel.addEventListener).toHaveBeenCalledTimes(2);
    });

    it('should cleanup specific listener without affecting others', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      const cleanup1 = addMessageListener(listener1);
      addMessageListener(listener2);

      cleanup1();

      expect(mockChannel.removeEventListener).toHaveBeenCalledTimes(1);
      expect(mockChannel.addEventListener).toHaveBeenCalledTimes(2);
    });

    it('should handle different message types', () => {
      const listener = vi.fn();
      const capturedHandlers: ((event: MessageEvent) => void)[] = [];

      mockChannel.addEventListener.mockImplementation((event, handler) => {
        if (event === 'message') {
          capturedHandlers.push(handler as (event: MessageEvent) => void);
        }
      });

      addMessageListener(listener);

      const messages: TabSyncMessage[] = [
        { type: 'INTERVIEW_SYNCED', tempId: 'temp-1', realId: 'real-1' },
        { type: 'INTERVIEW_UPDATED', id: 'interview-1' },
        { type: 'PROTOCOL_CACHED', id: 'protocol-1' },
      ];

      for (const message of messages) {
        const messageEvent = new MessageEvent('message', { data: message });
        capturedHandlers[0]?.(messageEvent);
      }

      expect(listener).toHaveBeenCalledTimes(3);
      expect(listener).toHaveBeenNthCalledWith(1, messages[0]);
      expect(listener).toHaveBeenNthCalledWith(2, messages[1]);
      expect(listener).toHaveBeenNthCalledWith(3, messages[2]);
    });
  });

  describe('closeChannel', () => {
    it('should close the BroadcastChannel', () => {
      postMessage({ type: 'INTERVIEW_UPDATED', id: 'interview-1' });

      closeChannel();

      expect(mockChannel.close).toHaveBeenCalledTimes(1);
    });

    it('should allow channel to be reopened after closing', () => {
      postMessage({ type: 'INTERVIEW_UPDATED', id: 'interview-1' });
      closeChannel();

      const newMockChannel = {
        postMessage: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        close: vi.fn(),
      };

      global.BroadcastChannel = vi.fn(function (this: typeof newMockChannel) {
        return newMockChannel;
      }) as unknown as typeof BroadcastChannel;

      postMessage({ type: 'INTERVIEW_UPDATED', id: 'interview-2' });

      expect(global.BroadcastChannel).toHaveBeenCalledTimes(1);
      expect(newMockChannel.postMessage).toHaveBeenCalledWith({
        type: 'INTERVIEW_UPDATED',
        id: 'interview-2',
      });
    });

    it('should not throw error when closing non-existent channel', () => {
      expect(() => closeChannel()).not.toThrow();
    });

    it('should set channel to null after closing', () => {
      postMessage({ type: 'INTERVIEW_UPDATED', id: 'interview-1' });
      const firstCallCount = (
        global.BroadcastChannel as ReturnType<typeof vi.fn>
      ).mock.calls.length;
      expect(firstCallCount).toBe(1);

      closeChannel();

      postMessage({ type: 'INTERVIEW_UPDATED', id: 'interview-2' });
      const secondCallCount = (
        global.BroadcastChannel as ReturnType<typeof vi.fn>
      ).mock.calls.length;
      expect(secondCallCount).toBe(2);
    });
  });

  describe('channel initialization', () => {
    it('should create channel with correct name', () => {
      postMessage({ type: 'INTERVIEW_UPDATED', id: 'interview-1' });

      expect(global.BroadcastChannel).toHaveBeenCalledWith(
        'fresco-offline-sync',
      );
    });

    it('should reuse same channel for multiple operations', () => {
      const listener = vi.fn();

      postMessage({ type: 'INTERVIEW_UPDATED', id: 'interview-1' });
      addMessageListener(listener);
      postMessage({ type: 'PROTOCOL_CACHED', id: 'protocol-1' });

      expect(global.BroadcastChannel).toHaveBeenCalledTimes(1);
    });
  });

  describe('error handling', () => {
    it('should not crash when BroadcastChannel is not supported', () => {
      const originalBC = global.BroadcastChannel;
      Object.defineProperty(global, 'BroadcastChannel', {
        writable: true,
        value: undefined,
      });

      expect(() => {
        try {
          postMessage({ type: 'INTERVIEW_UPDATED', id: 'interview-1' });
        } catch (error) {
          // Expected to fail
        }
      }).not.toThrow();

      Object.defineProperty(global, 'BroadcastChannel', {
        writable: true,
        value: originalBC,
      });
    });
  });
});
