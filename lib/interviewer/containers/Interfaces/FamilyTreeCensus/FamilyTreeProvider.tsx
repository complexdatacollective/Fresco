import { type NcEdge, type NcEgo, type NcNode } from '@codaco/shared-consts';
import { invariant } from 'es-toolkit';
import { createContext, useContext, useRef } from 'react';
import { useStore } from 'zustand';
import {
  createFamilyTreeStore,
  type Edge,
  type FamilyTreeStore,
  type FamilyTreeStoreApi,
  type Node,
} from './store';

const FamilyTreeContext = createContext<FamilyTreeStoreApi | undefined>(
  undefined,
);

export const FamilyTreeProvider = ({
  ego,
  nodes,
  edges,
  children,
}: {
  ego: NcEgo | null,
  nodes: NcNode[],
  edges: NcEdge[],
  children: React.ReactNode;
}) => {
  const storeRef = useRef<FamilyTreeStoreApi>();

  const initialNodes = new Map<string, Omit<Node, "id">>(
    nodes.map((node) => [node._uid, {
                label: node.attributes.name,
                sex: node.attributes.sex,
                readOnly: false,
                isEgo: false,
                interviewNetworkId: node._uid,
              }])
  );
  if (ego != null) {
    initialNodes.set(ego._uid, {
      label: "You",
      sex: ego.attributes.sex === 'male' ? 'male' : 'female',
      readOnly: false,
      isEgo: true,
      interviewNetworkId: ego._uid,
    })
  }
  const initialEdges = new Map<string, Omit<Edge, "id">>(
    edges.map((edge) => [edge._uid, {
                source: edge.attributes.from,
                target: edge.attributes.to,
                interviewNetworkId: edge._uid,
              }])
  );
  storeRef.current ??= createFamilyTreeStore(initialNodes, initialEdges);

  return (
    <FamilyTreeContext.Provider value={storeRef.current}>
      {children}
    </FamilyTreeContext.Provider>
  );
};

export const useFamilyTreeStore = <T,>(
  selector: (state: FamilyTreeStore) => T,
) => {
  const store = useContext(FamilyTreeContext);
  invariant(
    store,
    'useFamilyTreeStore must be used within a FamilyTreeProvider',
  );

  return useStore(store, selector);
};

// export const useFamilyTreeState = createUseState(useFamilyTreeStore);
