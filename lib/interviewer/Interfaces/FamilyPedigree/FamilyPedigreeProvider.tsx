import { type NcEdge, type NcNode } from '@codaco/shared-consts';
import { invariant } from 'es-toolkit';
import { createContext, useContext, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useStore } from 'zustand';
import {
  createFamilyPedigreeStore,
  type FamilyPedigreeStore,
  type FamilyPedigreeStoreApi,
  type NodeData,
  type StoreEdge,
  type VariableConfig,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/store';
import {
  getIsActiveVariable,
  getIsGestationalCarrierVariable,
  getRelationshipTypeVariable,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/utils/edgeUtils';
import {
  getEgoVariable,
  getNodeLabelVariable,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/utils/nodeUtils';
import { useAppDispatch } from '~/lib/interviewer/store';

const FamilyPedigreeContext = createContext<FamilyPedigreeStoreApi | undefined>(
  undefined,
);

export const FamilyPedigreeProvider = ({
  nodes,
  edges,
  children,
}: {
  nodes: NcNode[];
  edges: NcEdge[];
  children: React.ReactNode;
}) => {
  const storeRef = useRef<FamilyPedigreeStoreApi>(undefined);
  const dispatch = useAppDispatch();

  const nodeLabelVariable = useSelector(getNodeLabelVariable);
  const egoVariable = useSelector(getEgoVariable);
  const relationshipTypeVariable = useSelector(getRelationshipTypeVariable);
  const isActiveVariable = useSelector(getIsActiveVariable);
  const isGestationalCarrierVariable = useSelector(
    getIsGestationalCarrierVariable,
  );
  const variableConfig: VariableConfig = {
    nodeLabelVariable,
    egoVariable,
    relationshipTypeVariable,
    isActiveVariable,
    isGestationalCarrierVariable,
  };

  const initialNodes = new Map<string, NodeData>(
    nodes.map((node) => [
      node._uid,
      {
        isEgo: node.attributes[egoVariable] === true,
        readOnly: false,
        interviewNetworkId: node._uid,
        attributes: { ...node.attributes },
      },
    ]),
  );

  const initialEdges = new Map<string, StoreEdge>(
    edges.map((edge) => {
      const relationshipType = (edge.attributes[relationshipTypeVariable] ??
        'biological') as StoreEdge['relationshipType'];
      const isActive = edge.attributes[isActiveVariable] !== false;
      const isGestationalCarrier = edge.attributes[
        isGestationalCarrierVariable
      ] as boolean | undefined;

      const base = {
        source: edge.from,
        target: edge.to,
        isActive,
      };

      if (relationshipType === 'partner') {
        return [edge._uid, { ...base, relationshipType }];
      }

      return [
        edge._uid,
        {
          ...base,
          relationshipType,
          ...(isGestationalCarrier !== undefined
            ? { isGestationalCarrier }
            : {}),
        },
      ];
    }),
  );

  storeRef.current ??= createFamilyPedigreeStore(
    initialNodes,
    initialEdges,
    variableConfig,
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
