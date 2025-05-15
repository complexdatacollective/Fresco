import {
  entitySecureAttributesMeta,
  type NcNode,
  type VariableValue,
} from '@codaco/shared-consts';
import { invariant } from 'es-toolkit';
import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { makeGetCodebookVariablesForNodeType } from '~/lib/interviewer/selectors/protocol';
import { getEntityAttributes } from '~/lib/network-exporters/utils/general';
import { usePassphrase } from './usePassphrase';
import { decryptData, UnauthorizedError } from './utils';

/**
 * Mechanism for accessing node attributes, which takes into account
 * whether the attribute is encrypted or not.
 */
export const useNodeAttributes = (node: NcNode) => {
  const getCodebookVariablesForNodeType = useSelector(
    makeGetCodebookVariablesForNodeType,
  );
  const nodeAttributes = getEntityAttributes(node);
  const {
    requirePassphrase,
    setPassphraseInvalid,
    isEnabled,
    passphraseInvalid,
  } = usePassphrase();

  const getById = useCallback(
    async <T extends VariableValue>(
      attributeId: string,
    ): Promise<T | undefined> => {
      const codebookVariables = getCodebookVariablesForNodeType(node.type);

      const isEncrypted =
        isEnabled && codebookVariables[attributeId]?.encrypted;

      // If the attribute is not encrypted, we can return it directly
      if (!isEncrypted) {
        return nodeAttributes[attributeId] as T | undefined;
      }

      const secureAttributes = node[entitySecureAttributesMeta]?.[attributeId];

      invariant(secureAttributes, 'Secure attributes missing!');

      try {
        const passphrase = requirePassphrase();

        // This throw could ultimately be moved into requirePassphrase
        if (!passphrase) {
          throw new UnauthorizedError();
        }

        const result = await decryptData(
          {
            secureAttributes: {
              iv: secureAttributes.iv,
              salt: secureAttributes.salt,
            },
            data: nodeAttributes[attributeId] as number[],
          },
          passphrase,
        );

        return result as T;
      } catch (e) {
        // User cancelled
        if (e instanceof UnauthorizedError) {
          throw e;
        }

        // If we get here, the decryption failed. This is either because
        // the passphrase was incorrect, or there was another kind of error.
        // In either case the only thing we can do is to set the invalid passphrase
        // state so that the user can try again.
        if (!passphraseInvalid) {
          setPassphraseInvalid(true);
        }

        // eslint-disable-next-line no-console
        console.error(e);
        return '⚠️' as unknown as T;
      }
    },
    [
      getCodebookVariablesForNodeType,
      nodeAttributes,
      node,
      requirePassphrase,
      setPassphraseInvalid,
      passphraseInvalid,
      isEnabled,
    ],
  );

  return getById;
};
