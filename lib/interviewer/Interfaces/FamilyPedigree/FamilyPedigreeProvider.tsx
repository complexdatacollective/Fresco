import { type NcEdge, type NcNode } from '@codaco/shared-consts';
import { invariant } from 'es-toolkit';
import { createContext, useContext, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useStore } from 'zustand';
import {
  createFamilyPedigreeStore,
  type FamilyPedigreeStore,
  type FamilyPedigreeStoreApi,
  type NodeMetadata,
  type VariableConfig,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/store';
import {
  getEdgeTypeKey,
  getIsActiveVariable,
  getIsGestationalCarrierVariable,
  getRelationshipTypeVariable,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/utils/edgeUtils';
import {
  getEgoVariable,
  getNodeLabelVariable,
  getNodeTypeKey,
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

  const nodeType = useSelector(getNodeTypeKey);
  const edgeType = useSelector(getEdgeTypeKey);
  const nodeLabelVariable = useSelector(getNodeLabelVariable);
  const egoVariable = useSelector(getEgoVariable);
  const relationshipTypeVariable = useSelector(getRelationshipTypeVariable);
  const isActiveVariable = useSelector(getIsActiveVariable);
  const isGestationalCarrierVariable = useSelector(
    getIsGestationalCarrierVariable,
  );
  const variableConfig: VariableConfig = {
    nodeType,
    edgeType,
    nodeLabelVariable,
    egoVariable,
    relationshipTypeVariable,
    isActiveVariable,
    isGestationalCarrierVariable,
  };

  const initialNodes = new Map<string, NcNode>(
    nodes.map((node) => [node._uid, node]),
  );

  const initialEdges = new Map<string, NcEdge>(
    edges.map((edge) => [edge._uid, edge]),
  );

  const initialNodeMetadata = new Map<string, NodeMetadata>(
    nodes.map((node) => [
      node._uid,
      { readOnly: node.attributes[egoVariable] === true },
    ]),
  );

  storeRef.current ??= createFamilyPedigreeStore(
    initialNodes,
    initialEdges,
    initialNodeMetadata,
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
