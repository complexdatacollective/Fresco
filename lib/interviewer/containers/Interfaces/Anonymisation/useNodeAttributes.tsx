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

      if (!secureAttributes) {
        // eslint-disable-next-line no-console
        console.log(`Node ${node._uid} is missing secure attributes`);
        return undefined;
      }

      // This will trigger a prompt for the passphrase, and throw an error if it is cancelled.
      try {
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

        return decryptedValue as T;
      } catch (e) {
        console.log('here', e, e instanceof UnauthorizedError);
        // User cancelled or passphrase was incorrect
        if (e instanceof UnauthorizedError) {
          throw e;
        }

        // Internal error should be logged

        // eslint-disable-next-line no-console
        console.error(e);
        return undefined;
      }
    },
    [node, nodeAttributes, codebookAttributes, requirePassphrase],
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

      return await getById(attributeId);
    },
    [getById, codebookAttributes],
  );

  return {
    getByName,
    getById,
  };
};
