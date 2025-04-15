import { useCallback, useEffect, useState } from 'react';

// Define a type for the encryption state
type EncryptionState = {
  isEnabled: boolean;
  passphrase: string | null;
};

// Create a singleton instance to store the state
const globalState: {
  state: EncryptionState;
  listeners: Set<(state: EncryptionState) => void>;
} = {
  state: {
    isEnabled: false,
    passphrase: null,
  },
  listeners: new Set(),
};

export const useEncryptionState = () => {
  // Local state that mirrors the global state
  const [state, setState] = useState<EncryptionState>(globalState.state);

  useEffect(() => {
    // Subscribe to changes
    const listener = (newState: EncryptionState) => {
      setState(newState);
    };

    globalState.listeners.add(listener);

    // Initial state sync
    setState(globalState.state);

    // Cleanup
    return () => {
      globalState.listeners.delete(listener);
    };
  }, []);

  const enableEncryption = useCallback((passphrase: string) => {
    const newState = {
      isEnabled: true,
      passphrase,
    };
    globalState.state = newState;
    globalState.listeners.forEach((listener) => listener(newState));
  }, []);

  const disableEncryption = useCallback(() => {
    const newState = {
      isEnabled: false,
      passphrase: null,
    };
    globalState.state = newState;
    globalState.listeners.forEach((listener) => listener(newState));
  }, []);

  return {
    isEnabled: state.isEnabled,
    passphrase: state.passphrase,
    enableEncryption,
    disableEncryption,
  };
};
