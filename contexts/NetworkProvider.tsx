"use client";

import {
  createContext,
  useReducer,
  useContext,
  useEffect,
  PropsWithChildren,
} from "react";
import type { NcNetwork } from "~/lib/shared-consts";
import { prisma } from "~/utils/db";

const initialState: NcNetwork = {
  nodes: [],
  edges: [],
  ego: undefined,
};

type NetworkAction = {
  type:
    | "ADD_NODE"
    | "ADD_EDGE"
    | "UPDATE_NODE"
    | "UPDATE_EDGE"
    | "DELETE_NODE"
    | "DELETE_EDGE";
  payload: Record<string, unknown>;
};

function reducer(state: NcNetwork, action: NetworkAction): NcNetwork {
  switch (action.type) {
    case "ADD_NODE":
      return {
        ...state,
        nodes: [...state.nodes, action.payload],
      };
    case "ADD_EDGE":
      return {
        ...state,
        edges: [...state.edges, action.payload],
      };
    case "UPDATE_NODE":
      return {
        ...state,
        nodes: state.nodes.map((node) =>
          node.id === action.payload.id ? action.payload : node
        ),
      };
    case "UPDATE_EDGE":
      return {
        ...state,
        edges: state.edges.map((edge) =>
          edge.id === action.payload.id ? action.payload : edge
        ),
      };
    case "DELETE_NODE":
      return {
        ...state,
        nodes: state.nodes.filter((node) => node.id !== action.payload),
      };
    case "DELETE_EDGE":
      return {
        ...state,
        edges: state.edges.filter((edge) => edge.id !== action.payload),
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
  network: string | null;
  updateNetwork: (network: NcNetwork) => void;
};

const getInitialState = (network: string | null): NcNetwork => {
  if (network) {
    return JSON.parse(network) as NcNetwork;
  }
  return initialState;
};

function NetworkProvider({
  network,
  updateNetwork,
  children,
}: PropsWithChildren<NetworkProviderProps>) {
  console.log("network provider initial state", network);
  const [state, dispatch] = useReducer(reducer, getInitialState(network));

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

  console.log("use Interview", state);

  const addNode = (node) => {
    dispatch({ type: "ADD_NODE", payload: node });
  };

  const addEdge = (edge) => {
    dispatch({ type: "ADD_EDGE", payload: edge });
  };

  const updateNode = (node) => {
    dispatch({ type: "UPDATE_NODE", payload: node });
  };

  const updateEdge = (edge) => {
    dispatch({ type: "UPDATE_EDGE", payload: edge });
  };

  const deleteNode = (nodeId) => {
    dispatch({ type: "DELETE_NODE", payload: nodeId });
  };

  const deleteEdge = (edgeId) => {
    dispatch({ type: "DELETE_EDGE", payload: edgeId });
  };

  const nextPage = () => {
    // ...
    console.log("nextPage");
  };

  const previousPage = () => {
    // ...
    console.log("previousPage");
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
