import { type NcEdge, type NcEgo, type NcNode } from '@codaco/shared-consts';
import { invariant } from 'es-toolkit';
import { createContext, useContext, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useStore } from 'zustand';
import {
  createFamilyTreeStore,
  type FamilyTreeStore,
  type FamilyTreeStoreApi,
  type NodeData,
  type StoreEdge,
} from '~/lib/interviewer/Interfaces/FamilyTreeCensus/store';
import { type Sex } from '~/lib/pedigree-layout/types';
import { getRelationshipTypeVariable } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/utils/edgeUtils';
import {
  getEgoSexVariable,
  getNodeSexVariable,
} from '~/lib/interviewer/Interfaces/FamilyTreeCensus/utils/nodeUtils';
import { useAppDispatch } from '~/lib/interviewer/store';

const FamilyTreeContext = createContext<FamilyTreeStoreApi | undefined>(
  undefined,
);

function mapReduxEdgeToStoreEdge(
  relationship: string,
  source: string,
  target: string,
): StoreEdge {
  switch (relationship) {
    case 'bio-parent':
      return { source, target, type: 'parent', edgeType: 'bio-parent' };
    case 'donor':
      return { source, target, type: 'parent', edgeType: 'donor' };
    case 'surrogate':
      return { source, target, type: 'parent', edgeType: 'surrogate' };
    case 'partner':
      return { source, target, type: 'partner', current: true };
    case 'parent':
    case 'social-parent':
    default:
      return { source, target, type: 'parent', edgeType: 'social-parent' };
  }
}

export const FamilyTreeProvider = ({
  ego,
  nodes,
  edges,
  diseaseVariables,
  children,
}: {
  ego: NcEgo | null;
  nodes: NcNode[];
  edges: NcEdge[];
  diseaseVariables: string[];
  children: React.ReactNode;
}) => {
  const storeRef = useRef<FamilyTreeStoreApi>(undefined);
  const dispatch = useAppDispatch();
  const egoSexVariable = useSelector(getEgoSexVariable);
  const nodeSexVariable = useSelector(getNodeSexVariable);
  const relationshipVariable = useSelector(getRelationshipTypeVariable);

  const initialNodes = new Map<string, NodeData>(
    nodes.map((node) => {
      const diseases = new Map(
        diseaseVariables.map((disease) => [
          disease,
          node.attributes[disease] === true,
        ]),
      );
      return [
        node._uid,
        {
          label: '',
          sex: node.attributes[nodeSexVariable] as Sex | undefined,
          isEgo: false,
          readOnly: false,
          interviewNetworkId: node._uid,
          diseases,
        },
      ];
    }),
  );

  if (ego != null) {
    initialNodes.set(ego._uid, {
      label: 'You',
      sex: ego.attributes[egoSexVariable] === 'male' ? 'male' : 'female',
      isEgo: true,
      readOnly: true,
    });
  }

  const initialEdges = new Map<string, StoreEdge>(
    edges.map((edge) => {
      const relationship = (edge.attributes[relationshipVariable] ??
        '') as string;
      return [
        edge._uid,
        mapReduxEdgeToStoreEdge(relationship, edge.from, edge.to),
      ];
    }),
  );

  storeRef.current ??= createFamilyTreeStore(
    initialNodes,
    initialEdges,
    dispatch,
  );

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
