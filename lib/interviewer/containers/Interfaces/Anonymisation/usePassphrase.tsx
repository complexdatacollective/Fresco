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
    if (passphrase) {
      if (showPrompter) {
        dispatch(setShowPassphrasePrompter(false));
      }

      return passphrase;
    }

    if (!showPrompter) {
      dispatch(setShowPassphrasePrompter(true));
    }
    return undefined;
  }, [passphrase, dispatch, showPrompter]);

  const setPassphrase = useCallback(
    (passphrase: string) => {
      if (showPrompter) {
        dispatch(setShowPassphrasePrompter(false));
      }

      dispatch(setPassphraseAction(passphrase));
    },
    [dispatch, showPrompter],
  );

  return {
    isEnabled,
    passphrase,
    setPassphrase,
    requirePassphrase,
    showPassphrasePrompter: showPrompter,
  };
};
