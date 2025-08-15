import { entityPrimaryKeyProperty, NcNode } from '@codaco/shared-consts';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { updatePedigreeStageMetadata } from '~/lib/interviewer/ducks/modules/session';
import { getEntityAttributes } from '~/lib/network-exporters/utils/general';
import { useAppDispatch } from '../../../store';
import { PlaceholderNodeProps } from './FamilyTreeNode';

const getStringNodeAttribute = (node: NcNode, attribute: string): string => {
  const value = getEntityAttributes(node)[attribute];
  return typeof value === 'string' ? value : 'unknown';
};

const getNumberNodeAttribute = (node: NcNode, attribute: string): number => {
  const value = getEntityAttributes(node)[attribute];
  return typeof value === 'number' ? value : 0;
};

interface UseFamilyTreeNodesReturn {
  placeholderNodes: PlaceholderNodeProps[];
  addPlaceholderNode: (
    gender: string,
    label: string,
    parentIds: string[],
  ) => PlaceholderNodeProps;
  setPlaceholderNodesBulk: (nodes: PlaceholderNodeProps[]) => void;
  updateNodes: (
    updates: Partial<PlaceholderNodeProps & { id: string }>[],
  ) => void;
  allNodes: PlaceholderNodeProps[];
}

function useFamilyTreeNodes(networkNodes: NcNode[]): UseFamilyTreeNodesReturn {
  const [placeholderNodes, setPlaceholderNodes] = useState<
    PlaceholderNodeProps[]
  >([]);

  const dispatch = useAppDispatch();

  const addPlaceholderNode = useCallback(
    (gender: string, label: string, parentIds: string[]) => {
      const newNode: PlaceholderNodeProps = {
        id: crypto.randomUUID(),
        gender,
        label,
        parentIds,
        childIds: [],
        xPos: 0,
        yPos: 0,
      };
      setPlaceholderNodes((prev) => [...prev, newNode]);
      return newNode;
    },
    [],
  );

  const setPlaceholderNodesBulk = useCallback(
    (nodes: PlaceholderNodeProps[]) => {
      setPlaceholderNodes((prev) => {
        const prevById = Object.fromEntries(prev.map((n) => [n.id, n]));
        for (const node of nodes) {
          prevById[node.id] = node; // overwrite if exists, add if new
        }
        return Object.values(prevById);
      });
    },
    [],
  );

  const updateNodes = useCallback(
    (updates: Partial<PlaceholderNodeProps & { id: string }>[]) => {
      setPlaceholderNodes((prev) => {
        const updatesMap = new Map(updates.map((node) => [node.id, node]));
        return prev.map((node) =>
          updatesMap.has(node.id)
            ? { ...node, ...updatesMap.get(node.id) }
            : node,
        );
      });
    },
    [],
  );

  const networkNodesAsPlaceholders = useMemo(() => {
    return networkNodes.map((node) => ({
      id: node[entityPrimaryKeyProperty],
      gender: getStringNodeAttribute(node, 'gender'),
      label: getStringNodeAttribute(node, 'name'),
      xPos: getNumberNodeAttribute(node, 'x'),
      yPos: getNumberNodeAttribute(node, 'y'),
      parentIds: [],
      childIds: [],
    }));
  }, [networkNodes]);

  const allNodes = useMemo(() => {
    const networkNodeIds = networkNodes.map(
      (node) => node[entityPrimaryKeyProperty],
    );
    const filteredPlaceholders = placeholderNodes.filter(
      (node) => !networkNodeIds.includes(node.id ?? ''),
    );
    return [...filteredPlaceholders, ...networkNodesAsPlaceholders];
  }, [placeholderNodes, networkNodesAsPlaceholders]);

  useEffect(() => {
    dispatch(updatePedigreeStageMetadata(placeholderNodes));
  }, [placeholderNodes, dispatch]);

  return {
    placeholderNodes,
    setPlaceholderNodesBulk,
    addPlaceholderNode,
    updateNodes,
    allNodes,
  };
}

export default useFamilyTreeNodes;
