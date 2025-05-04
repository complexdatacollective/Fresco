import {
  entitySecureAttributesMeta,
  type NcNode,
  type VariableValue,
} from '@codaco/shared-consts';
import { invariant } from 'es-toolkit';
import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { getCodebookVariablesForNodeType } from '~/lib/interviewer/selectors/protocol';
import { getEntityAttributes } from '~/lib/network-exporters/utils/general';
import { usePassphrase } from './usePassphrase';
import { decryptData, UnauthorizedError } from './utils';

/**
 * Mechanism for accessing node attributes, which takes into account
 * whether the attribute is encrypted or not.
 */
export const useNodeAttributes = (
  node: NcNode,
): {
  getById<T extends VariableValue>(attributeId: string): Promise<T | undefined>;
  getByName<T extends VariableValue>({
    attributeName,
    ignoreCase,
  }: {
    attributeName: string;
    ignoreCase?: boolean;
  }): Promise<T | undefined>;
  getByFuzzyMatch<T extends VariableValue>(
    match: RegExp,
  ): Promise<T | undefined>;
} => {
  const codebookAttributes = useSelector(
    getCodebookVariablesForNodeType(node.type),
  );
  const nodeAttributes = getEntityAttributes(node);
  const { requirePassphrase, setPassphraseInvalid, isEnabled } =
    usePassphrase();

  const getByFuzzyMatch = useCallback(
    async <T extends VariableValue>(test: RegExp) => {
      const match = Object.keys(nodeAttributes).find((attribute) =>
        test.test(attribute),
      );

      if (match) {
        console.log('found', match);
        return getById<T>(match);
      }

      return undefined;
    },
    [nodeAttributes],
  );

  const getById = useCallback(
    async <T extends VariableValue>(
      attributeId: string,
    ): Promise<T | undefined> => {
      const isEncrypted =
        isEnabled && codebookAttributes[attributeId]?.encrypted;

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
        setPassphraseInvalid(true);

        // eslint-disable-next-line no-console
        console.error(e);
        return '⚠️' as unknown as T;
      }
    },
    [
      codebookAttributes,
      nodeAttributes,
      node,
      requirePassphrase,
      setPassphraseInvalid,
      isEnabled,
    ],
  );

  const getByName = useCallback(
    async <T extends VariableValue>({
      attributeName,
      ignoreCase,
    }: {
      attributeName: string;
      ignoreCase?: boolean;
    }): Promise<T | undefined> => {
      const attributeId = Object.keys(codebookAttributes).find((id) => {
        const name = codebookAttributes[id]!.name;

        return ignoreCase
          ? name.toLowerCase() === attributeName.toLowerCase()
          : name === attributeName;
      });

      if (!attributeId) {
        return undefined;
      }

      return getById<T>(attributeId);
    },
    [getById, codebookAttributes],
  );

  return {
    getByFuzzyMatch,
    getByName,
    getById,
  };
};
