import { invariant } from 'es-toolkit';
import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { getCodebookVariablesForNodeType } from '~/lib/interviewer/selectors/protocol';
import {
  entitySecureAttributesMeta,
  type NcNode,
  type VariableValue,
} from '~/lib/shared-consts';
import { getEntityAttributes } from '~/utils/general';
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
} => {
  const codebookAttributes = useSelector(
    getCodebookVariablesForNodeType(node.type),
  );
  const nodeAttributes = getEntityAttributes(node);
  const { requirePassphrase } = usePassphrase();

  const getById = useCallback(
    async <T extends VariableValue>(
      attributeId: string,
    ): Promise<T | undefined> => {
      const isEncrypted = codebookAttributes[attributeId]?.encrypted;

      // If the attribute is not encrypted, we can return it directly
      if (!isEncrypted) {
        return nodeAttributes[attributeId] as T | undefined;
      }

      const secureAttributes = node[entitySecureAttributesMeta]?.[attributeId];

      invariant(secureAttributes, 'Node is missing secure attributes');

      const passphrase = requirePassphrase();

      if (!passphrase) {
        throw new UnauthorizedError();
      }

      // This will trigger a prompt for the passphrase, and throw an error if it is cancelled.
      try {
        const result = await decryptData(
          {
            secureAttributes: {
              iv: secureAttributes.iv,
              salt: secureAttributes.salt,
            },
            data: nodeAttributes[attributeId],
          },
          passphrase,
        );

        console.log('decryptedValue', result);

        return result as T;
      } catch (e) {
        console.log('here', e, e instanceof UnauthorizedError);
        // User cancelled or passphrase was incorrect
        if (e instanceof UnauthorizedError) {
          throw e;
        }

        // eslint-disable-next-line no-console
        console.error(e);
        return '⚠️';
      }
    },
    [codebookAttributes, nodeAttributes, node, requirePassphrase],
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

      return getById(attributeId);
    },
    [getById, codebookAttributes],
  );

  return {
    getByName,
    getById,
  };
};
