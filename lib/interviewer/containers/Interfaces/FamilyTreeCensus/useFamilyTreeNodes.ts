import { type Stage } from '@codaco/protocol-validation';
import {
  entityPrimaryKeyProperty,
  type EntityAttributesProperty,
  type NcNode,
} from '@codaco/shared-consts';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { updateFamilyTreeMetadata } from '~/lib/interviewer/containers/Interfaces/FamilyTreeCensus/censusMetadataUtil';
import { type PlaceholderNodeProps } from '~/lib/interviewer/containers/Interfaces/FamilyTreeCensus/FamilyTreeNode';
import {
  addNode,
  updateStageMetadata,
} from '~/lib/interviewer/ducks/modules/session';
import {
  getNetworkNodes,
  getStageMetadata,
} from '~/lib/interviewer/selectors/session';
import { useAppDispatch } from '~/lib/interviewer/store';
import { getEntityAttributes } from '~/lib/network-exporters/utils/general';

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

type UseFamilyTreeNodesReturn = {
  placeholderNodes: PlaceholderNodeProps[];
  setPlaceholderNodesBulk: (nodes: PlaceholderNodeProps[]) => void;
  removePlaceholderNode: (nodeId: string) => void;
  commitPlaceholderNode: (
    node: PlaceholderNodeProps,
    attributes: NcNode[EntityAttributesProperty],
  ) => void;
  allNodes: PlaceholderNodeProps[];
};

function useFamilyTreeNodes(
  stage: Extract<Stage, { type: 'FamilyTreeCensus' }>,
): UseFamilyTreeNodesReturn {
  const [placeholderNodes, setPlaceholderNodes] = useState<
    PlaceholderNodeProps[]
  >([]);
  const dispatch = useAppDispatch();

  const stageMetadata = useSelector(getStageMetadata);

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

  const networkNodes = useSelector(getNetworkNodes);

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
        isEgo: existing?.isEgo,
        networkNode: net,
      });
    }

    return Array.from(nodeMap.values());
  }, [networkNodes, placeholderNodes]);

  const allNodes = useMemo(() => {
    const networkIds = new Set(
      networkNodes.map((n) => n[entityPrimaryKeyProperty]),
    );
    const placeholdersOnly = placeholderNodes.filter(
      (p) => !networkIds.has(p.id),
    );
    return [...placeholdersOnly, ...networkNodesAsPlaceholders];
  }, [placeholderNodes, networkNodesAsPlaceholders, networkNodes]);

  useEffect(() => {
    const censusMetadata: [number, string, string, boolean][] =
      updateFamilyTreeMetadata(stageMetadata ?? [], placeholderNodes);
    dispatch(updateStageMetadata(censusMetadata));
  }, [placeholderNodes]);

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
                  Object.values(attributes).find(
                    (val) => typeof val === 'string',
                  )! ??
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

        function collectDeletions(id: string, deletePartner: boolean) {
          const node = byId.get(id);
          if (!node || toDelete.has(id)) return;

          if (node.unDeletable) return;

          // Always delete the node itself
          toDelete.add(id);

          // Delete children
          (node.childIds || []).forEach((childId) =>
            collectDeletions(childId, true),
          );

          // Conditionally delete partner
          if (deletePartner && node.partnerId) {
            const partner = byId.get(node.partnerId);
            if (partner && !partner.unDeletable) {
              toDelete.add(node.partnerId);
            }
          }
        }

        const target = byId.get(nodeId);
        if (!target) return prev;

        const relatedToEgo = (target.parentIds || []).length > 0;

        collectDeletions(nodeId, relatedToEgo);

        // Remove all marked nodes
        for (const id of toDelete) {
          byId.delete(id);
        }

        // Clean references
        let cleaned = [...byId.values()].map((n) => ({
          ...n,
          parentIds: (n.parentIds || []).filter((pid) => !toDelete.has(pid)),
          childIds: (n.childIds || []).filter((cid) => !toDelete.has(cid)),
          partnerId: toDelete.has(n.partnerId || '') ? undefined : n.partnerId,
          exPartnerId: toDelete.has(n.exPartnerId || '')
            ? undefined
            : n.exPartnerId,
        }));

        // Extra cleanup: if blood relation lost last shared child with exPartner, delete exPartner
        const extraDeletes = new Set<string>();
        cleaned.forEach((n) => {
          if ((n.parentIds || []).length > 0) {
            // blood relative
            // Handle exPartnerId
            if (n.exPartnerId) {
              const exPartner = cleaned.find((c) => c.id === n.exPartnerId);
              if (exPartner && !exPartner.unDeletable) {
                // Check if they still share any children
                const sharedChildren = (n.childIds || []).filter((cid) =>
                  exPartner.childIds?.includes(cid),
                );
                if (sharedChildren.length === 0) {
                  extraDeletes.add(exPartner.id);
                }
              }
            }

            // Handle partnerId (unchanged from before)
            if (n.partnerId) {
              const partner = cleaned.find((c) => c.id === n.partnerId);
              if (
                partner &&
                (partner.parentIds || []).length === 0 &&
                !partner.unDeletable &&
                (n.childIds || []).length === 0
              ) {
                extraDeletes.add(partner.id);
              }
            }
          }
        });

        if (extraDeletes.size > 0) {
          cleaned = cleaned.filter((n) => !extraDeletes.has(n.id));
          cleaned = cleaned.map((n) => ({
            ...n,
            partnerId: extraDeletes.has(n.partnerId || '')
              ? undefined
              : n.partnerId,
            exPartnerId: extraDeletes.has(n.exPartnerId || '')
              ? undefined
              : n.exPartnerId,
          }));
        }

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
