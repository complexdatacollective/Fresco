import { useSelector } from 'react-redux';
import { getCodebookVariablesForNodeType } from '~/lib/interviewer/selectors/protocol';
import {
  entitySecureAttributesMeta,
  type NcNode,
  type VariableValue,
} from '~/lib/shared-consts';
import { getEntityAttributes } from '~/utils/general';
import { decryptData } from './utils';

export const useNodeAttributes = (
  node: NcNode,
): {
  getById<T extends VariableValue>(attributeId: string): Promise<T | null>;
  getByName<T extends VariableValue>(attributeName: string): Promise<T | null>;
} => {
  const codebookAttributes = useSelector(
    getCodebookVariablesForNodeType(node.type),
  );
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

  const getByName = async (attributeName: string) => {
    const attributeId = Object.keys(codebookAttributes).find(
      (id) =>
        codebookAttributes[id]!.name.toLowerCase() ===
        attributeName.toLowerCase(),
    );

    if (!attributeId) {
      return null;
    }

    return await getById(attributeId);
  };

  return {
    getByName,
    getById,
  };
};
