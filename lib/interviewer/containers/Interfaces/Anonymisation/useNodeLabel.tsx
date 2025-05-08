import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  type NcNode,
} from '@codaco/shared-consts';
import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  getCodebookForNodeType,
  makeGetCodebookForNodeType,
} from '~/lib/interviewer/selectors/protocol';
import { getNodeLabelAttribute } from '~/lib/interviewer/utils/getNodeLabelAttribute';
import { useMakeNodeAttributes, useNodeAttributes } from './useNodeAttributes';
import { UnauthorizedError } from './utils';

export function useNodeLabel(node: NcNode) {
  const [label, setLabel] = useState<string | undefined>(undefined);
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

      // Use the codebook entity type name, and fall
      const codebookTypeName = codebook?.name;
      setLabel(codebookTypeName ?? node[entityPrimaryKeyProperty]);
      return;
    };

    void calculateLabel();
  }, [codebook, getById, node]);

  return label;
}

// As above but returning a function that takes a node
export function useNodeLabeller() {
  const getCodebookForNodeType = useSelector(makeGetCodebookForNodeType);
  const getById = useMakeNodeAttributes();

  const getNodeLabel = useCallback(
    async (node: NcNode): Promise<string> => {
      const codebook = getCodebookForNodeType(node.type);
      const labelAttributeId = getNodeLabelAttribute(
        codebook?.variables,
        node[entityAttributesProperty],
      );

      if (labelAttributeId) {
        try {
          const labelValue = await getById(node)(labelAttributeId);
          if (
            (labelValue && typeof labelValue === 'string') ||
            typeof labelValue === 'number'
          ) {
            return String(labelValue);
          }
        } catch (e) {
          if (e instanceof UnauthorizedError) {
            return '🔒';
          }
        }
      }

      return codebook?.name ?? node[entityPrimaryKeyProperty];
    },
    [getCodebookForNodeType, getById],
  );

  return getNodeLabel;
}
