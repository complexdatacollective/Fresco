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

const getFirstStringAttribute = (node: NcNode): string => {
  const attrs = getEntityAttributes(node);
  for (const val of Object.values(attrs)) {
    if (typeof val === 'string') return val;
  }
  return '';
};

const getAttr = <T extends string | number>(
  node: NcNode,
  key: string,
): T | undefined => {
  const val = getEntityAttributes(node)[key];
  return (typeof val === typeof ('' as T) ? val : undefined) as T | undefined;
};

interface UseFamilyTreeNodesReturn {
  placeholderNodes: PlaceholderNodeProps[];
  setPlaceholderNodesBulk: (nodes: PlaceholderNodeProps[]) => void;
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
    const phById = new Map(placeholderNodes.map((p) => [p.id, p]));

    return networkNodes.map<PlaceholderNodeProps>((net) => {
      const id = net[entityPrimaryKeyProperty];
      const existing = phById.get(id);

      return {
        id,
        gender: getAttr<string>(net, 'gender') ?? existing?.gender ?? 'unknown',
        label:
          getAttr<string>(net, 'name') ??
          getFirstStringAttribute(net) ??
          existing?.label ??
          '',
        xPos: getAttr<number>(net, 'x') ?? existing?.xPos ?? 0,
        yPos: getAttr<number>(net, 'y') ?? existing?.yPos ?? 0,

        parentIds: existing?.parentIds ?? [],
        childIds: existing?.childIds ?? [],
        partnerId: existing?.partnerId,

        networkNode: net,
      };
    });
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

  return {
    placeholderNodes,
    setPlaceholderNodesBulk,
    commitPlaceholderNode,
    allNodes,
  };
}

export default useFamilyTreeNodes;
