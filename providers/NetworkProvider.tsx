'use client';

import {
  createContext,
  useReducer,
  useContext,
  useEffect,
  type PropsWithChildren,
} from 'react';
import type { NcEdge, NcNetwork, NcNode } from '@codaco/shared-consts';

const initialState: NcNetwork = {
  nodes: [],
  edges: [],
  ego: undefined,
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

const NetworkContext = createContext({
  state: initialState,
  dispatch: () => null,
} as {
  state: NcNetwork;
  dispatch: (action: NetworkAction) => void;
});

type NetworkProviderProps = {
  network: NcNetwork;
  updateNetwork: (network: NcNetwork) => void;
};

function NetworkProvider({
  network,
  updateNetwork,
  children,
}: PropsWithChildren<NetworkProviderProps>) {
  const [state, dispatch] = useReducer(reducer, network);

  // When state changes, sync it with the server using react query
  useEffect(() => {
    updateNetwork(state);
  }, [state, updateNetwork]);

  return (
    <NetworkContext.Provider value={{ state, dispatch }}>
      {children}
    </NetworkContext.Provider>
  );
}

const useInterview = () => {
  const { state, dispatch } = useContext(NetworkContext);

  const addNode = (node: NcNode) => {
    dispatch({ type: 'ADD_NODE', payload: node });
  };

  const addEdge = (edge: NcEdge) => {
    dispatch({ type: 'ADD_EDGE', payload: edge });
  };

  const updateNode = (node: NcNode) => {
    dispatch({ type: 'UPDATE_NODE', payload: node });
  };

  const updateEdge = (edge: NcEdge) => {
    dispatch({ type: 'UPDATE_EDGE', payload: edge });
  };

  const deleteNode = (nodeId: string) => {
    dispatch({ type: 'DELETE_NODE', payload: nodeId });
  };

  const deleteEdge = (edgeId: string) => {
    dispatch({ type: 'DELETE_EDGE', payload: edgeId });
  };

  const nextPage = () => {
    // ...
  };

  const previousPage = () => {
    // ...
  };

  const hasNextPage = () => {
    // ...
    return true;
  };

  const hasPreviousPage = () => {
    // ...
    return true;
  };

  return {
    network: state,
    addNode,
    addEdge,
    updateNode,
    updateEdge,
    deleteNode,
    deleteEdge,
    nextPage,
    previousPage,
    hasNextPage,
    hasPreviousPage,
  };
};

export { NetworkContext, NetworkProvider, useInterview };
