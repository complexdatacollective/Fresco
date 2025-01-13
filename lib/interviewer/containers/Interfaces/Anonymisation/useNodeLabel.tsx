import { useEffect, useState } from 'react';
import { type NcNode } from '~/lib/shared-consts';
import { getEntityAttributes } from '~/utils/general';
import { useNodeAttributes } from './useNodeAttributes';
import { UnauthorizedError } from './utils';

export function useNodeLabel(node: NcNode) {
  const [label, setLabel] = useState<string | undefined>(undefined);
  const { getByName } = useNodeAttributes(node);

  useEffect(() => {
    async function calculateLabel() {
      // 1. Look for a variable called 'name'.
      try {
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
        console.log('yooo');
        setLabel('Error fetching name');
        return;
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
    }

    void calculateLabel();
  }, [node, getByName]);

  return label;
}
