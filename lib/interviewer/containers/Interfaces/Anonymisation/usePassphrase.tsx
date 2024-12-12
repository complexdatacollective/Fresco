import { useCallback, useEffect, useState } from 'react';

export class UnauthorizedError extends Error {
  constructor() {
    super('Unauthorized: No passphrase provided');
    this.name = 'UnauthorizedError';
  }
}

type EncryptionState = {
  isEnabled: boolean;
  passphrase: string | null;
  isPrompting: boolean;
};

// Singleton to store the global state and promise management
const globalState: {
  state: EncryptionState;
  listeners: Set<(state: EncryptionState) => void>;
  currentPromise: Promise<string> | null;
} = {
  state: {
    isEnabled: false,
    passphrase: null,
    isPrompting: false,
  },
  listeners: new Set(),
  currentPromise: null,
};

const updateState = (newState: Partial<EncryptionState>) => {
  globalState.state = { ...globalState.state, ...newState };
  globalState.listeners.forEach((listener) => listener(globalState.state));
};

export const usePassphrase = () => {
  const [state, setState] = useState<EncryptionState>(globalState.state);

  useEffect(() => {
    const listener = (newState: EncryptionState) => {
      setState(newState);
    };

    globalState.listeners.add(listener);
    setState(globalState.state);

    return () => {
      globalState.listeners.delete(listener);
    };
  }, []);

  const requirePassphrase = useCallback(async (): Promise<string> => {
    // If we already have a passphrase, return it
    if (globalState.state.passphrase) {
      return globalState.state.passphrase;
    }

    // If we're already prompting, return the existing promise
    if (globalState.currentPromise) {
      return globalState.currentPromise;
    }

    // Create a new promise for the passphrase prompt
    globalState.currentPromise = new Promise<string>((resolve, reject) => {
      updateState({ isPrompting: true });

      // We're using prompt here, but you could replace this with a custom modal
      const userInput = prompt('Please enter your passphrase to continue.');

      updateState({ isPrompting: false });

      if (!userInput) {
        const error = new UnauthorizedError();
        window.dispatchEvent(
          new CustomEvent('passphrase-cancel', { detail: error }),
        );
        reject(error);
        return;
      }

      updateState({
        passphrase: userInput,
        isEnabled: true,
      });

      window.dispatchEvent(
        new CustomEvent('passphrase-set', { detail: userInput }),
      );
      resolve(userInput);
    }).finally(() => {
      globalState.currentPromise = null;
    });

    return globalState.currentPromise;
  }, []);

  const clearPassphrase = useCallback(() => {
    updateState({
      passphrase: null,
      isEnabled: false,
    });
    window.dispatchEvent(new CustomEvent('passphrase-cleared'));
  }, []);

  const setPassphrase = useCallback((newPassphrase: string) => {
    if (!newPassphrase) {
      throw new UnauthorizedError();
    }

    updateState({
      passphrase: newPassphrase,
      isEnabled: true,
    });

    window.dispatchEvent(
      new CustomEvent('passphrase-set', { detail: newPassphrase }),
    );
  }, []);

  return {
    isEnabled: state.isEnabled,
    passphrase: state.passphrase,
    isPrompting: state.isPrompting,
    requirePassphrase,
    clearPassphrase,
    setPassphrase,
  };
};
