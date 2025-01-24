import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getPassphrase,
  setPassphrase as setPassphraseAction,
  setShowPassphrasePrompter,
  showPassphrasePrompter,
} from '~/lib/interviewer/ducks/modules/ui';

export class UnauthorizedError extends Error {
  constructor() {
    super('Unauthorized: No passphrase provided');
    this.name = 'UnauthorizedError';
  }
}

export const usePassphrase = () => {
  const dispatch = useDispatch();

  const isEnabled = true;

  const passphrase = useSelector(getPassphrase);
  const showPrompter = useSelector(showPassphrasePrompter);

  const requirePassphrase = useCallback(() => {
    console.log('requirePassphrase');
    // If we already have a passphrase, return it
    if (passphrase) {
      dispatch(setShowPassphrasePrompter(false));
      return passphrase;
    }

    // Determine if a password is needed here?
    if (!showPrompter) {
      dispatch(setShowPassphrasePrompter(true));
    }

    return undefined;
  }, [passphrase, dispatch, showPrompter]);

  const setPassphrase = useCallback(
    (passphrase: string) => {
      dispatch(setShowPassphrasePrompter(false));
      dispatch(setPassphraseAction(passphrase));
    },
    [dispatch],
  );

  return {
    isEnabled,
    passphrase,
    setPassphrase,
    requirePassphrase,
    showPassphrasePrompter: showPrompter,
  };
};
