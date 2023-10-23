import { useReducer } from 'react';
import type { NcEdge, NcNetwork, NcNode } from '@codaco/shared-consts';

const initialState: NcNetwork = {
  nodes: [],
  edges: [],
};

type NetworkActionBase = {
  type:
    | 'ADD_NODE'
    | 'ADD_EDGE'
    | 'UPDATE_NODE'
    | 'UPDATE_EDGE'
    | 'DELETE_NODE'
    | 'DELETE_EDGE';
  payload: unknown;
};

type ActionAddNode = NetworkActionBase & {
  type: 'ADD_NODE';
  payload: NcNode;
};

type ActionAddEdge = NetworkActionBase & {
  type: 'ADD_EDGE';
  payload: NcEdge;
};

type ActionUpdateNode = NetworkActionBase & {
  type: 'UPDATE_NODE';
  payload: NcNode;
};

type ActionUpdateEdge = NetworkActionBase & {
  type: 'UPDATE_EDGE';
  payload: NcEdge;
};

type ActionDeleteNode = NetworkActionBase & {
  type: 'DELETE_NODE';
  payload: string;
};

type ActionDeleteEdge = NetworkActionBase & {
  type: 'DELETE_EDGE';
  payload: string;
};

type NetworkAction =
  | ActionAddNode
  | ActionAddEdge
  | ActionUpdateNode
  | ActionUpdateEdge
  | ActionDeleteNode
  | ActionDeleteEdge;

function reducer(state: NcNetwork, action: NetworkAction): NcNetwork {
  switch (action.type) {
    case 'ADD_NODE':
      return {
        ...state,
        nodes: [...state.nodes, action.payload],
      };
    case 'ADD_EDGE':
      return {
        ...state,
        edges: [...state.edges, action.payload],
      };
    case 'UPDATE_NODE':
      return {
        ...state,
        nodes: state.nodes.map((node) =>
          node._uid === action.payload._uid ? action.payload : node,
        ),
      };
    case 'UPDATE_EDGE':
      return {
        ...state,
        edges: state.edges.map((edge) =>
          edge._uid === action.payload._uid ? action.payload : edge,
        ),
      };
    case 'DELETE_NODE':
      return {
        ...state,
        nodes: state.nodes.filter((node) => node._uid !== action.payload),
      };
    case 'DELETE_EDGE':
      return {
        ...state,
        edges: state.edges.filter((edge) => edge._uid !== action.payload),
      };
    default:
      return state;
  }
}

const useNetwork = (initialNetwork = initialState) => {
  const [network, dispatch] = useReducer(reducer, initialNetwork);

  const networkHandlers = {
    addNode: (node: NcNode) => {
      dispatch({ type: 'ADD_NODE', payload: node });
    },

    addEdge: (edge: NcEdge) => {
      dispatch({ type: 'ADD_EDGE', payload: edge });
    },

    updateNode: (node: NcNode) => {
      dispatch({ type: 'UPDATE_NODE', payload: node });
    },

    updateEdge: (edge: NcEdge) => {
      dispatch({ type: 'UPDATE_EDGE', payload: edge });
    },

    deleteNode: (nodeId: string) => {
      dispatch({ type: 'DELETE_NODE', payload: nodeId });
    },

    deleteEdge: (edgeId: string) => {
      dispatch({ type: 'DELETE_EDGE', payload: edgeId });
    },
  };

  return { network, networkHandlers };
};

export default useNetwork;
