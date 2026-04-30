import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  type NcNode,
} from '@codaco/shared-consts';
import { hash as objectHash } from 'ohash';
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import usePrevious from '@codaco/fresco-ui/hooks/usePrevious';
import { makeGetCodebookForNodeType } from '~/lib/interviewer/selectors/protocol';
import { getNodeLabelAttribute } from '~/lib/interviewer/utils/getNodeLabelAttribute';
import { useNodeAttributes } from './useNodeAttributes';
import { usePassphrase } from './usePassphrase';
import { UnauthorizedError } from './utils';

// Will speed up if the same node is rendered in multiple places.
const labelCache = new Map<string, string>();

export function useNodeLabel(node: NcNode | undefined) {
  const getCodebookForNodeType = useSelector(makeGetCodebookForNodeType);
  const codebook = node ? getCodebookForNodeType(node.type) : undefined;
  const { passphrase } = usePassphrase();
  const prevPassphrase = usePrevious(passphrase);
  const prevNode = usePrevious(node);

  const cacheKey = useMemo(() => (node ? objectHash(node) : ''), [node]);

  const labelAttributeId = getNodeLabelAttribute(
    codebook?.variables ?? {},
    node?.[entityAttributesProperty] ?? {},
  );

  const getById = useNodeAttributes(node);
  const [label, setLabel] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!node) return;

    const fallback = codebook?.name ?? node[entityPrimaryKeyProperty];

    // Only check the cache if the passphrase is the same, to allow revalidating
    // Also skip the cache if the node attributes changed
    if (prevPassphrase === passphrase && prevNode === node) {
      if (labelCache.has(cacheKey)) {
        setLabel(labelCache.get(cacheKey));
        return;
      }
    }

    if (!labelAttributeId) {
      setLabel(fallback);
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
  }, [
    labelAttributeId,
    codebook,
    node,
    getById,
    cacheKey,
    passphrase,
    prevPassphrase,
    prevNode,
  ]);

  return label;
}
