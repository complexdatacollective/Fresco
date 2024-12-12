import { UnauthorizedError } from './utils';

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    getting: boolean;
    passphrase: string | null;
  }
}

// Custom hook that allows for storing and retriving a passphrase from session storage.
// Emits a custom event when the passphrase is set, and triggers a dialog if the passphrase
// is not set.
export function usePassphrase() {
  // const dispatch = useDispatch();
  // const openDialog = useCallback(
  //   (dialog: Dialog) =>
  //     dispatch(dialogActions.openDialog(dialog) as unknown as AnyAction),
  //   [dispatch],
  // );

  async function requirePassphrase(): Promise<string> {
    if (window.passphrase) {
      return Promise.resolve(window.passphrase);
    }

    if (window.getting) {
      // Return a promise that resolves based on events from the dialog.
      return new Promise((resolve, reject) => {
        window.addEventListener('passphrase-set', () => {
          resolve(window.passphrase!);
        });

        window.addEventListener('passphrase-cancel', () => {
          reject(new UnauthorizedError());
        });
      });
    }

    window.getting = true;

    window.passphrase = prompt('Please enter your passphrase to continue.');

    window.getting = false;

    if (!window.passphrase) {
      window.dispatchEvent(new CustomEvent('passphrase-cancel'));
      throw new UnauthorizedError();
    }

    window.dispatchEvent(new CustomEvent('passphrase-set'));

    return Promise.resolve(window.passphrase);
  }

  return requirePassphrase;
}
