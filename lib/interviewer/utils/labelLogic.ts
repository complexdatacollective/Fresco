import { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { actionCreators as dialogActions } from '~/lib/interviewer/ducks/modules/dialogs';
import getEntityAttributes from '~/lib/interviewer/utils/getEntityAttributes';
import {
  type Codebook,
  type Variables,
} from '~/lib/protocol-validation/schemas/src/8.zod';
import {
  decryptData,
  entitySecureAttributesMeta,
  type NodeWithSecureAttributes,
} from '../containers/Interfaces/Anonymisation';
import { getCodebookVariablesForNodeType } from '../selectors/protocol';

export class UnauthorizedError extends Error {
  constructor() {
    super('Unauthorized');
    this.name = 'UnauthorizedError';
  }
}

export const SESSION_STORAGE_KEY = 'passphrase';

export function getPassphrase() {
  return sessionStorage.getItem(SESSION_STORAGE_KEY);
}

window.getting = false;

// Custom hook that allows for storing and retriving a passphrase from session storage.
// Emits a custom event when the passphrase is set, and triggers a dialog if the passphrase
// is not set.
export function usePassphrase() {
  const [passphrase, setPassphrase] = useState(() =>
    sessionStorage.getItem(SESSION_STORAGE_KEY),
  );

  const dispatch = useDispatch();
  const openDialog = useCallback(
    (dialog) => dispatch(dialogActions.openDialog(dialog)),
    [dispatch],
  );

  async function requirePassphrase() {
    if (passphrase) {
      return passphrase as string;
    }

    if (window.getting) {
      // Return a promise that doesn't resolve
      return new Promise((resolve, reject) => {
        window.addEventListener('passphrase-set', () => {
          resolve('passphrase');
        });

        window.addEventListener('passphrase-cancel', () => {
          reject(new UnauthorizedError());
        });
      });
    }

    window.getting = true;
    const result = await openDialog({
      id: '1234-1234-1',
      type: 'Confirm',
      title: 'Something to confirm',
      message: 'More detail about confirmation',
      confirmLabel: 'Yes please!',
      onConfirm: () => {},
      onCancel: () => {},
    });
    window.getting = false;
    console.log(result);

    if (!result) {
      window.dispatchEvent(new CustomEvent('passphrase-cancel'));
      throw new UnauthorizedError();
    }

    sessionStorage.setItem(SESSION_STORAGE_KEY, 'passphrase');
    setPassphrase('passphrase' as string);

    window.dispatchEvent(new CustomEvent('passphrase-set'));

    return 'passphrase';
  }

  return requirePassphrase;
}

export type Variable =
  | string
  | unknown[]
  | boolean
  | number
  | Record<string, unknown>;

export const useNodeAttributes = (
  node: NodeWithSecureAttributes,
): {
  getById<T extends Variable>(attributeId: string): Promise<T | null>;
  getByName<T extends Variable>(attributeName: string): Promise<T | null>;
} => {
  const codebookAttributes = useSelector(
    getCodebookVariablesForNodeType(node.type),
  ) as Codebook['node'][string]['variables'];
  const nodeAttributes = getEntityAttributes(node);
  const requirePassphrase = usePassphrase();

  async function getById(attributeId: string) {
    const isEncrypted = codebookAttributes[attributeId]?.encrypted;

    if (!isEncrypted) {
      return nodeAttributes[attributeId];
    }

    const secureAttributes = node[entitySecureAttributesMeta]?.[attributeId];

    if (!secureAttributes) {
      // eslint-disable-next-line no-console
      console.log(`Node ${node._uid} is missing secure attributes`);
      return null;
    }

    // This will trigger a prompt for the passphrase, and throw an error if it is cancelled.
    const passphrase = await requirePassphrase();

    const decryptedValue = await decryptData(
      {
        [entitySecureAttributesMeta]: {
          salt: secureAttributes.salt,
          iv: secureAttributes.iv,
        },
        data: nodeAttributes[attributeId] as number[],
      },
      passphrase,
    );

    return decryptedValue;
  }

  async function getByName(attributeName: string) {
    const attributeId = Object.keys(codebookAttributes).find(
      (id) =>
        codebookAttributes[id]!.name.toLowerCase() ===
        attributeName.toLowerCase(),
    );

    if (!attributeId) {
      return null;
    }

    return await getById(attributeId);
  }

  return {
    getByName,
    getById,
  };
};

// See: https://github.com/complexdatacollective/Network-Canvas/wiki/Node-Labeling
export async function labelLogic(
  codebookVariables: Variables,
  node: NodeWithSecureAttributes,
): Promise<string> {
  const nodeAttributes = getEntityAttributes(node);

  // 1. In the codebook for the stage's subject, look for a variable with a name
  // property of "name", and try to retrieve this value by key in the node's
  // attributes
  const variableCalledName = Object.keys(codebookVariables).find(
    (variableId) =>
      codebookVariables[variableId]?.name.toLowerCase() === 'name',
  );

  if (variableCalledName && nodeAttributes[variableCalledName]) {
    // Handle encrypted value.
    const isEncrypted = codebookVariables[variableCalledName]?.encrypted;

    if (!isEncrypted) {
      return nodeAttributes[variableCalledName] as string;
    }

    // Handle encrypted value.
    // To do this, we need to fetch the salt and IV from the secure attributes,
    // and the passphrase.
    const secureAttributes =
      node[entitySecureAttributesMeta]?.[variableCalledName];

    if (!secureAttributes) {
      // eslint-disable-next-line no-console
      console.log(`Node ${node._uid} is missing secure attributes`);
      return '❌ 🔒';
    }

    const passphrase = getPassphrase();

    // If we don't have an active passphrase, show the lock icon.
    if (!passphrase) {
      return '🔒';
    }

    const decryptedValue = await decryptData(
      {
        [entitySecureAttributesMeta]: {
          salt: secureAttributes.salt,
          iv: secureAttributes.iv,
        },
        data: nodeAttributes[variableCalledName] as number[],
      },
      passphrase,
    );

    return `🔓\n${decryptedValue}`;
  }

  // 2. Look for a property on the node with a key of ‘name’, and try to retrieve this
  // value as a key in the node's attributes.
  // const nodeVariableCalledName = get(nodeAttributes, 'name');
  if (
    Object.keys(nodeAttributes)
      .map((a) => a.toLowerCase())
      .includes('name')
  ) {
    return nodeAttributes.name as string;
  }

  // 3. Last resort!
  return "No 'name' variable!";
}
