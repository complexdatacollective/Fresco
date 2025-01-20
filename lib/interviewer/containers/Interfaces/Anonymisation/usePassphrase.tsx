import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setPassphrase } from '~/lib/interviewer/ducks/modules/session';
import { type RootState } from '~/lib/interviewer/store';

export class UnauthorizedError extends Error {
  constructor() {
    super('Unauthorized: No passphrase provided');
    this.name = 'UnauthorizedError';
  }
}

type EncryptionState = {
  isPrompting: boolean;
};

// Singleton to store the global state and promise management
const globalState: {
  state: EncryptionState;
  listeners: Set<(state: EncryptionState) => void>;
  currentPromise: Promise<string> | null;
} = {
  state: {
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
  const dispatch = useDispatch();

  // Keeps track of if a passphrase has ever been set. Used to determine if we
  // should prompt for a passphrase or not.
  const encryptionEnabled = useSelector(
    (state: RootState) => state.session.encryptionEnabled,
  );

  const passphrase = useSelector(
    (state: RootState) => state.session.passphrase,
  );

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
    if (passphrase) {
      return passphrase;
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

      dispatch(setPassphrase(userInput));

      resolve(userInput);
    }).finally(() => {
      globalState.currentPromise = null;
    });

    return globalState.currentPromise;
  }, [passphrase, dispatch]);

  return {
    isEnabled: encryptionEnabled,
    passphrase,
    isPrompting: state.isPrompting,
    requirePassphrase,
  };
};
