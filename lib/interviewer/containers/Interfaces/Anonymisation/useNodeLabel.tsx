import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  type NcNode,
} from '@codaco/shared-consts';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { makeGetCodebookForNodeType } from '~/lib/interviewer/selectors/protocol';
import { getNodeLabelAttribute } from '~/lib/interviewer/utils/getNodeLabelAttribute';
import { useNodeAttributes } from './useNodeAttributes';
import { usePassphrase } from './usePassphrase';
import { UnauthorizedError } from './utils';

// Will speed up if the same node is rendered in multiple places.
const labelCache = new Map<string, string>();

export function useNodeLabel(node: NcNode): string {
  const getCodebookForNodeType = useSelector(makeGetCodebookForNodeType);
  const codebook = getCodebookForNodeType(node.type);
  const { passphrase } = usePassphrase();

  const labelAttributeId = getNodeLabelAttribute(
    codebook?.variables ?? {},
    node[entityAttributesProperty],
  );

  const getById = useNodeAttributes(node);
  const [label, setLabel] = useState('');

  useEffect(() => {
    const fallback = codebook?.name ?? node[entityPrimaryKeyProperty];

    if (!labelAttributeId) {
      setLabel(fallback);
      return;
    }

    const cacheKey = `${node[entityPrimaryKeyProperty]}:${labelAttributeId}`;

    if (labelCache.has(cacheKey)) {
      setLabel(labelCache.get(cacheKey)!);
      return;
    }

    void (async () => {
      try {
        const value = await getById<string | number>(labelAttributeId);
        const stringValue = String(value ?? fallback);
        labelCache.set(cacheKey, stringValue);
        setLabel(stringValue);
      } catch (e) {
        if (e instanceof UnauthorizedError) {
          setLabel('🔒');
          return;
        }
      }
    })();
  }, [labelAttributeId, codebook, getById, node, passphrase]);

  return label;
}
