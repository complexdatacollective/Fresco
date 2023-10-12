'use client';

import {
  createContext,
  useReducer,
  useContext,
  useEffect,
  type PropsWithChildren,
  useState,
} from 'react';
import type {
  NcEdge,
  NcNetwork,
  NcNode,
  Protocol,
} from '@codaco/shared-consts';
import { trpc } from '~/app/_trpc/client';
import { usePathname, useRouter } from 'next/navigation';
import useNetwork from '../hooks/useNetwork';
import { set } from 'react-hook-form';

const InterviewContext = createContext();

type InterviewProviderProps = {
  protocol: Protocol;
  interviewId: string;
};

function InterviewProvider({ children }) {
  const pathname = usePathname();

  const interviewId = pathname.split('/')[2];

  console.log('interviewId', interviewId);

  const [initialized, setInitialized] = useState(false);
  const [network, handlers] = useNetwork();

  const { data: interview, isLoading } = trpc.interview.get.byId.useQuery(
    {
      id: interviewId,
    },
    {
      onSuccess: () => {
        setInitialized(true);
      },
    },
  );
  const { mutate: updateNetwork } = trpc.interview.updateNetwork.useMutation();

  // useEffect(() => {
  //   console.log('network');
  // }, [network]);

  // useEffect(() => {
  //   console.log('updateNetwork');
  // }, [updateNetwork]);

  // useEffect(() => {
  //   console.log('interviewId', interviewId);
  // }, [interviewId]);

  // When state changes, sync it with the server using react query
  useEffect(() => {
    if (!initialized) return;
    updateNetwork({ interviewId, network });
    console.log('network changed', network);
  }, [network, updateNetwork, interviewId, initialized]);

  return (
    <InterviewContext.Provider
      value={{ network, handlers, protocol: interview?.protocol, interviewId }}
    >
      {children}
    </InterviewContext.Provider>
  );
}

const useInterview = () => {
  const { protocol, interviewId, network, handlers } =
    useContext(InterviewContext);
  const pathname = usePathname();
  const router = useRouter();

  const currentStage = parseInt(pathname.split('/').pop()!, 10);
  const protocolStageCount = protocol?.stages.length;

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

  return {
    network,
    ...handlers,
    nextPage,
    previousPage,
    hasNextPage: hasNextPage(),
    hasPreviousPage: hasPreviousPage(),
  };
};

export { InterviewContext, InterviewProvider, useInterview };
