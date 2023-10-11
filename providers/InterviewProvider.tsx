'use client';

import {
  createContext,
  useReducer,
  useContext,
  useEffect,
  type PropsWithChildren,
} from 'react';
import type {
  NcEdge,
  NcNetwork,
  NcNode,
  Protocol,
} from '@codaco/shared-consts';
import { trpc } from '~/app/_trpc/client';
import { usePathname, useRouter } from 'next/navigation';

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

const InterviewContext = createContext({
  network: initialState,
  dispatch: () => null,
  protocol: null,
  interviewId: '',
} as {
  network: NcNetwork;
  dispatch: (action: NetworkAction) => void;
  protocol: Protocol | null;
  interviewId: string;
});

type InterviewProviderProps = {
  network: NcNetwork;
  protocol: Protocol;
  interviewId: string;
};

function InterviewProvider({
  network,
  protocol,
  interviewId,
  children,
}: PropsWithChildren<InterviewProviderProps>) {
  const [state, dispatch] = useReducer(reducer, network, () => initialState);

  console.log('provider', network, state, protocol);

  const { mutate: updateNetwork } = trpc.interview.updateNetwork.useMutation();

  // When state changes, sync it with the server using react query
  useEffect(() => {
    updateNetwork({ interviewId, network: state });
    console.log('state changed', state);
  }, [state, updateNetwork, interviewId]);

  return (
    <InterviewContext.Provider
      value={{ network: state, dispatch, protocol, interviewId }}
    >
      {children}
    </InterviewContext.Provider>
  );
}

const useInterview = () => {
  const { network, dispatch, protocol, interviewId } =
    useContext(InterviewContext);
  const pathname = usePathname();
  const router = useRouter();

  const currentStage = parseInt(pathname.split('/').pop()!, 10);
  const protocolStageCount = protocol?.stages.length;

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
    const nextStage = currentStage + 1;
    if (nextStage > protocolStageCount!) return;

    router.push(`/interview/${interviewId}/${nextStage}`);
  };

  const previousPage = () => {
    const previousStage = currentStage - 1;
    if (previousStage < 1) return;
    router.push(`/interview/${interviewId}/${previousStage}`);
  };

  const hasNextPage = () => currentStage < protocolStageCount!;

  const hasPreviousPage = () => currentStage > 1;

  console.log('useInterview', pathname);

  return {
    network,
    addNode,
    addEdge,
    updateNode,
    updateEdge,
    deleteNode,
    deleteEdge,
    nextPage,
    previousPage,
    hasNextPage: hasNextPage(),
    hasPreviousPage: hasPreviousPage(),
  };
};

export { InterviewContext, InterviewProvider, useInterview };
