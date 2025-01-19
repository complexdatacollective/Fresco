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
  getByName<T extends VariableValue>(
    attributeName: string,
  ): Promise<T | undefined>;
} => {
  const codebookAttributes = useSelector(
    getCodebookVariablesForNodeType(node.type),
  );
  const nodeAttributes = getEntityAttributes(node);
  const { passphrase } = usePassphrase();

  const getById = async <T extends VariableValue>(
    attributeId: string,
  ): Promise<T | undefined> => {
    const isEncrypted = codebookAttributes[attributeId]?.encrypted;

    if (!isEncrypted) {
      return nodeAttributes[attributeId] as T | undefined;
    }

    const secureAttributes = node[entitySecureAttributesMeta]?.[attributeId];

    if (!secureAttributes) {
      // eslint-disable-next-line no-console
      console.log(`Node ${node._uid} is missing secure attributes`);
      return undefined;
    }

    if (!passphrase) {
      console.log('useNodeAttributes - no passphrase');
      throw new UnauthorizedError();
    }

    try {
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
      // User cancelled or passphrase was incorrect
      if (e instanceof UnauthorizedError) {
        return undefined;
      }

      // Internal error should be logged

      // eslint-disable-next-line no-console
      console.error(e);
      return undefined;
    }
  };

  const getByName = async <T extends VariableValue>(
    attributeName: string,
  ): Promise<T | undefined> => {
    const attributeId = Object.keys(codebookAttributes).find(
      (id) =>
        codebookAttributes[id]!.name.toLowerCase() ===
        attributeName.toLowerCase(),
    );

    if (!attributeId) {
      return undefined;
    }

    return await getById(attributeId);
  };

  return {
    getByName,
    getById,
  };
};
