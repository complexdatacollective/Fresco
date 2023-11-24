'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type {
  NcEdge,
  NcNetwork,
  NcNode,
  Protocol,
  Stage,
} from '@codaco/shared-consts';
import { api } from '~/trpc/client';
import useNetwork from '../hooks/useNetwork';
import { parseAsInteger, useQueryState } from 'next-usequerystate';

const InterviewContext = createContext({
  network: {} as NcNetwork,
  networkHandlers: {
    addNode: (_node: NcNode) => null,
    addEdge: (_edge: NcEdge) => null,
    updateNode: (_node: NcNode) => null,
    updateEdge: (_edge: NcEdge) => null,
    deleteNode: (_nodeId: string) => null,
    deleteEdge: (_edgeId: string) => null,
  },
  navigationHandlers: {
    nextPage: () => null,
    previousPage: () => null,
    hasNextPage: false,
    hasPreviousPage: false,
  },
  protocol: {} as Protocol,
  interviewId: '',
  stageConfig: {} as Stage,
  currentStageIndex: 0,
  progress: 0,
});

function InterviewProvider({
  children,
  interviewId,
  initialNetwork,
  protocol,
}: {
  children: React.ReactNode;
  interviewId: string;
  initialNetwork: NcNetwork;
  protocol: Protocol;
}) {
  const [currentStage, setCurrentStage] = useQueryState(
    'stage',
    parseAsInteger.withDefault(1),
  );
  const [initialized, setInitialized] = useState(false);
  const { network, networkHandlers } = useNetwork(initialNetwork);
  const { mutate: updateNetwork } = api.interview.updateNetwork.useMutation({
    onError: (error) => {
      throw new Error(error.message);
    },
  });

  const stages = protocol.stages;
  const protocolStageCount = stages.length + 1; // +1 for the finish stage which is inserted by the selectors
  const currentStageIndex = currentStage - 1;
  const progress = (currentStage / protocolStageCount) * 100;
  const stageConfig = stages[currentStageIndex]!;

  const navigationHandlers = {
    nextPage: () => {
      const nextStage = currentStage + 1;
      if (nextStage > protocolStageCount) return;

      void setCurrentStage(nextStage);
    },
    previousPage: () => {
      const previousStage = currentStage - 1;
      if (previousStage < 1) return;

      void setCurrentStage(previousStage);
    },
    hasNextPage: currentStage < protocolStageCount,
    hasPreviousPage: currentStage > 1,
    goToPage: (page: number) => setCurrentStage(page),
  };

  // When state changes, sync it with the server using react query
  useEffect(() => {
    if (!initialized) {
      setInitialized(true);
      return;
    }

    updateNetwork({ interviewId, network });
  }, [network, updateNetwork, initialized, interviewId]);

  return (
    <InterviewContext.Provider
      value={{
        network,
        networkHandlers,
        navigationHandlers,
        protocol,
        interviewId,
        stageConfig,
        currentStageIndex,
        progress,
      }}
    >
      {children}
    </InterviewContext.Provider>
  );
}

const useInterview = () => {
  const {
    protocol,
    network,
    networkHandlers,
    navigationHandlers,
    stageConfig,
    currentStageIndex,
    progress,
  } = useContext(InterviewContext);

  return {
    network,
    protocol,
    stageConfig,
    currentStageIndex,
    progress,
    ...networkHandlers,
    ...navigationHandlers,
  };
};

export { InterviewContext, InterviewProvider, useInterview };
