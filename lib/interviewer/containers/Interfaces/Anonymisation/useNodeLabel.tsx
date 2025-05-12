import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  type NcNode,
} from '@codaco/shared-consts';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { getCodebookForNodeType } from '~/lib/interviewer/selectors/protocol';
import { getNodeLabelAttribute } from '~/lib/interviewer/utils/getNodeLabelAttribute';
import { useNodeAttributes } from './useNodeAttributes';
import { UnauthorizedError } from './utils';

export function useNodeLabel(node: NcNode) {
  const [label, setLabel] = useState<string>('');
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const { getById } = useNodeAttributes(node);
  const codebook = useSelector(getCodebookForNodeType(node.type));

  useEffect(() => {
    const labelAttributeId = getNodeLabelAttribute(
      codebook?.variables ?? {},
      node[entityAttributesProperty],
    );

    const calculateLabel = async () => {
      if (labelAttributeId) {
        try {
          const labelValue = await getById(labelAttributeId);
          if (
            (labelValue && typeof labelValue === 'string') ||
            typeof labelValue === 'number'
          ) {
            setLabel(String(labelValue));
            return;
          }
        } catch (e) {
          if (e instanceof UnauthorizedError) {
            setLabel('🔒');
            return;
          }
        }
      }

      // Use the codebook entity type name
      const codebookTypeName = codebook?.name;
      setLabel(codebookTypeName ?? node[entityPrimaryKeyProperty]);
      return;
    };

    void calculateLabel();
  }, [codebook, getById, node]);

  return label;
}
