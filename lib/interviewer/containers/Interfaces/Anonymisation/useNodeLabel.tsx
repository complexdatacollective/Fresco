import { type NcNode } from '@codaco/shared-consts';
import { useEffect, useState } from 'react';
import { getEntityAttributes } from '~/lib/network-exporters/utils/general';
import { useNodeAttributes } from './useNodeAttributes';
import { UnauthorizedError } from './utils';

export function useNodeLabel(node: NcNode) {
  const [label, setLabel] = useState<string | undefined>(undefined);
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const { getByName } = useNodeAttributes(node);

  useEffect(() => {
    const calculateLabel = async () => {
      // 1. Look for a variable called 'name' in the codebook
      try {
        // This will throw an error if the variable is encrypted and the passphrase is not provided
        const variableCalledName = await getByName<string>({
          attributeName: 'name',
          ignoreCase: true,
        });

        if (variableCalledName) {
          setLabel(variableCalledName);
          return;
        }
      } catch (e) {
        if (e instanceof UnauthorizedError) {
          setLabel('🔒');
          return;
        }
      }

      // 2. Look for a property on the node with a key of ‘name’
      const nodeAttributes = getEntityAttributes(node);

      if (
        Object.keys(nodeAttributes)
          .map((a) => a.toLowerCase())
          .includes('name')
      ) {
        setLabel(nodeAttributes.name as string);
        return;
      }

      // 3. Last resort!
      setLabel("No 'name' variable!");
      return;
    };

    void calculateLabel();
  }, [node, getByName]);

  return label;
}
