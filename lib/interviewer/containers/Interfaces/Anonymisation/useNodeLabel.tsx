import { entityPrimaryKeyProperty, type NcNode } from '@codaco/shared-consts';
import { useEffect, useState } from 'react';
import { getEntityAttributes } from '~/lib/network-exporters/utils/general';
import { ensureError } from '~/utils/ensureError';
import { useNodeAttributes } from './useNodeAttributes';
import { UnauthorizedError } from './utils';

export function useNodeLabel(node: NcNode) {
  const [label, setLabel] = useState<string | undefined>(undefined);
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const { getByName, getByFuzzyMatch } = useNodeAttributes(node);

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

        // 2. Use a fuzzy match to try and find a variable name that includes 'name' in the codebook
        const fuzzyName = await getByFuzzyMatch<string>(new RegExp('name'));
        console.log('f', fuzzyName);
        if (fuzzyName) {
          setLabel(fuzzyName);
          return;
        }
      } catch (e) {
        const error = ensureError(e);

        console.log(error.message);
        if (e instanceof UnauthorizedError) {
          setLabel('🔒');
          return;
        }
      }

      // 3. Look for a property on the node with a key that includes 'name'
      let foundName: string | null = null;

      const nodeAttributes = getEntityAttributes(node);
      for (const attribute of Object.keys(nodeAttributes)) {
        if (attribute.toLowerCase().includes('name')) {
          foundName = attribute;
        }
      }

      if (foundName) {
        setLabel(nodeAttributes[foundName] as string);
        return;
      }

      // 3. Last resort!
      setLabel(node[entityPrimaryKeyProperty]);
      return;
    };

    void calculateLabel();
  }, [node, getByName, getByFuzzyMatch]);

  return label;
}
