import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getShouldEncryptNames } from '~/lib/interviewer/ducks/modules/protocol';
import {
  getPassphrase,
  getPassphraseInvalid,
  setPassphrase as setPassphraseAction,
  setPassphraseInvalid as setPassphraseInvalidAction,
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

  const isEnabled = useSelector(getShouldEncryptNames);

  const passphrase = useSelector(getPassphrase);
  const passphraseInvalid = useSelector(getPassphraseInvalid);
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
      dispatch(setShowPassphrasePrompter(false));

      dispatch(setPassphraseAction(passphrase));
    },
    [dispatch],
  );

  const setPassphraseInvalid = useCallback(
    (state: boolean) => {
      dispatch(setPassphraseInvalidAction(state));
    },
    [dispatch],
  );

  return {
    isEnabled,
    passphrase,
    passphraseInvalid,
    setPassphrase,
    requirePassphrase,
    showPassphrasePrompter: showPrompter,
    setPassphraseInvalid,
  };
};
