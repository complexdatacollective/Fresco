import { Stage } from '@codaco/protocol-validation';
import {
  entityPrimaryKeyProperty,
  type EntityAttributesProperty,
  type NcNode,
} from '@codaco/shared-consts';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  addNode,
  updatePedigreeStageMetadata,
} from '~/lib/interviewer/ducks/modules/session';
import { getEntityAttributes } from '~/lib/network-exporters/utils/general';
import { useAppDispatch } from '../../../store';
import { PlaceholderNodeProps } from './FamilyTreeNode';

const getStringNodeAttribute = (node: NcNode, key: string): string => {
  const val = getEntityAttributes(node)[key];
  return typeof val === 'string' ? val : '';
};

const getNumberNodeAttribute = (
  node: NcNode,
  key: string,
): number | undefined => {
  const val = getEntityAttributes(node)[key];
  return typeof val === 'number' ? val : undefined;
};

interface UseFamilyTreeNodesReturn {
  placeholderNodes: PlaceholderNodeProps[];
  setPlaceholderNodesBulk: (nodes: PlaceholderNodeProps[]) => void;
  removePlaceholderNode: (nodeId: string) => void;
  commitPlaceholderNode: (
    node: PlaceholderNodeProps,
    attributes: NcNode[EntityAttributesProperty],
  ) => void;
  allNodes: PlaceholderNodeProps[];
}

function useFamilyTreeNodes(
  networkNodes: NcNode[],
  stage: Extract<Stage, { type: 'FamilyTreeCensus' }>,
): UseFamilyTreeNodesReturn {
  const [placeholderNodes, setPlaceholderNodes] = useState<
    PlaceholderNodeProps[]
  >([]);
  const dispatch = useAppDispatch();

  const setPlaceholderNodesBulk = useCallback(
    (nodes: PlaceholderNodeProps[]) => {
      setPlaceholderNodes((prev) => {
        const byId = new Map(prev.map((n) => [n.id, n]));
        for (const n of nodes) byId.set(n.id, n);
        return [...byId.values()];
      });
    },
    [],
  );

  const networkNodesAsPlaceholders = useMemo(() => {
    const existingMap = new Map(placeholderNodes.map((p) => [p.id, p]));

    const nodeMap = new Map<string, PlaceholderNodeProps>();

    for (const net of networkNodes) {
      const id = net[entityPrimaryKeyProperty];
      const existing = existingMap.get(id);

      nodeMap.set(id, {
        id,
        gender:
          getStringNodeAttribute(net, 'gender') ||
          existing?.gender ||
          'unknown',
        label: getStringNodeAttribute(net, 'name') || existing?.label || '',
        xPos: getNumberNodeAttribute(net, 'x') ?? existing?.xPos ?? 0,
        yPos: getNumberNodeAttribute(net, 'y') ?? existing?.yPos ?? 0,
        parentIds: existing?.parentIds ?? [],
        childIds: existing?.childIds ?? [],
        partnerId: existing?.partnerId,
        networkNode: net,
      });
    }

    return Array.from(nodeMap.values());
  }, [networkNodes, placeholderNodes]);

  const allNodes = useMemo(() => {
    const networkIds = new Set(
      networkNodes.map((n) => n[entityPrimaryKeyProperty] as string),
    );
    const placeholdersOnly = placeholderNodes.filter(
      (p) => !networkIds.has(p.id),
    );
    return [...placeholdersOnly, ...networkNodesAsPlaceholders];
  }, [placeholderNodes, networkNodesAsPlaceholders, networkNodes]);

  useEffect(() => {
    dispatch(updatePedigreeStageMetadata(placeholderNodes));
  }, [placeholderNodes, dispatch]);

  const commitPlaceholderNode = useCallback(
    (
      node: PlaceholderNodeProps,
      attributes: NcNode[EntityAttributesProperty],
    ) => {
      void dispatch(
        addNode({
          type: stage.subject.type,
          modelData: { [entityPrimaryKeyProperty]: node.id },
          attributeData: attributes,
        }),
      );

      setPlaceholderNodes((prev) =>
        prev.map((p) =>
          p.id === node.id
            ? {
                ...p,
                label:
                  (attributes.name as string) ??
                  (Object.values(attributes).find(
                    (val) => typeof val === 'string',
                  ) as string) ??
                  p.label,
              }
            : p,
        ),
      );
    },
    [dispatch],
  );

  const removePlaceholderNode = useCallback(
    (nodeId: string) => {
      setPlaceholderNodes((prev) => {
        const byId = new Map(prev.map((n) => [n.id, n]));

        const toDelete = new Set<string>();

        function collectDeletions(id: string) {
          const node = byId.get(id);
          if (!node || toDelete.has(id)) return;

          if (node.unDeleatable) return;

          toDelete.add(id);

          (node.childIds || []).forEach((childId) => collectDeletions(childId));

          if (node.partnerId) {
            const partner = byId.get(node.partnerId);
            if (partner && !partner.unDeleatable) {
              toDelete.add(node.partnerId);
            }
          }
        }

        collectDeletions(nodeId);

        for (const id of toDelete) {
          byId.delete(id);
        }

        const cleaned = [...byId.values()].map((n) => ({
          ...n,
          parentIds: (n.parentIds || []).filter((pid) => !toDelete.has(pid)),
          childIds: (n.childIds || []).filter((cid) => !toDelete.has(cid)),
          partnerId: toDelete.has(n.partnerId || '') ? undefined : n.partnerId,
        }));

        return cleaned;
      });
    },
    [setPlaceholderNodes],
  );

  return {
    placeholderNodes,
    setPlaceholderNodesBulk,
    removePlaceholderNode,
    commitPlaceholderNode,
    allNodes,
  };
}

export default useFamilyTreeNodes;
