import { type NcEdge, type NcEgo, type NcNode } from '@codaco/shared-consts';
import { invariant } from 'es-toolkit';
import { createContext, useContext, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useStore } from 'zustand';
import { type NodeShape } from '~/components/Node';
import {
  createFamilyPedigreeStore,
  type FamilyPedigreeStore,
  type FamilyPedigreeStoreApi,
  type NodeData,
  type StoreEdge,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/store';
import { getRelationshipTypeVariable } from '~/lib/interviewer/Interfaces/FamilyPedigree/utils/edgeUtils';
import {
  getEgoShapeVariable,
  getNodeShapeVariable,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/utils/nodeUtils';
import { useAppDispatch } from '~/lib/interviewer/store';

const FamilyPedigreeContext = createContext<FamilyPedigreeStoreApi | undefined>(
  undefined,
);

function mapReduxEdgeToStoreEdge(
  relationship: string,
  source: string,
  target: string,
): StoreEdge {
  switch (relationship) {
    case 'donor':
      return {
        source,
        target,
        relationshipType: 'donor',
        isActive: true,
      };
    case 'surrogate':
      return {
        source,
        target,
        relationshipType: 'surrogate',
        isActive: true,
      };
    case 'partner':
      return {
        source,
        target,
        relationshipType: 'partner',
        isActive: true,
      };
    case 'bio-parent':
      return {
        source,
        target,
        relationshipType: 'biological',
        isActive: true,
      };
    case 'social-parent':
      return {
        source,
        target,
        relationshipType: 'social',
        isActive: true,
      };
    case 'parent':
    default:
      return {
        source,
        target,
        relationshipType: 'biological',
        isActive: true,
      };
  }
}

export const FamilyPedigreeProvider = ({
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
  const storeRef = useRef<FamilyPedigreeStoreApi>(undefined);
  const dispatch = useAppDispatch();
  const egoShapeVariable = useSelector(getEgoShapeVariable);
  const nodeShapeVariable = useSelector(getNodeShapeVariable);
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
          shape: node.attributes[nodeShapeVariable] as NodeShape | undefined,
          isEgo: false,
          readOnly: false,
          interviewNetworkId: node._uid,
          diseases,
        },
      ];
    }),
  );

  if (ego != null) {
    const egoShapeValue = ego.attributes[egoShapeVariable];
    const shape: NodeShape =
      egoShapeValue === 'circle' || egoShapeValue === 'diamond'
        ? egoShapeValue
        : 'square';
    initialNodes.set(ego._uid, {
      label: 'You',
      shape,
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

  storeRef.current ??= createFamilyPedigreeStore(
    initialNodes,
    initialEdges,
    dispatch,
  );

  return (
    <FamilyPedigreeContext.Provider value={storeRef.current}>
      {children}
    </FamilyPedigreeContext.Provider>
  );
};

export const useFamilyPedigreeStore = <T,>(
  selector: (state: FamilyPedigreeStore) => T,
) => {
  const store = useContext(FamilyPedigreeContext);
  invariant(
    store,
    'useFamilyPedigreeStore must be used within a FamilyPedigreeProvider',
  );

  return useStore(store, selector);
};
