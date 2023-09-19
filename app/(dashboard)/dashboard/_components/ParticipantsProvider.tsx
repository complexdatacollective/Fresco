'use client';

import type { Participant } from '@prisma/client';
import { createContext, useContext, useEffect, useState } from 'react';
import { ModalContext } from './ModalProvider';

const ParticipantsContext = createContext<Promise<Participant[]> | null>(null);

export const useParticipants = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<Participant[] | null>(null);

  const getParticipants = useContext(ParticipantsContext);

  if (!getParticipants) {
    throw new Error(
      'useParticipants must be used within a ParticipantsProvider',
    );
  }

  useEffect(() => {
    const doWork = async () => {
      const participants = await getParticipants;
      setIsLoading(false);
      setData(participants);
    };

    doWork().catch((err) => {
      // eslint-disable-next-line no-console
      console.error(err);
      throw err;
    });
  }, [getParticipants]);

  return {
    isLoading,
    participants: data,
  };
};

export const ParticipantsProvider = ({
  children,
  getParticipants,
}: {
  children: React.ReactNode;
  getParticipants: Promise<Participant[]>;
}) => {
  const [state, setState] = useState({
    open: false,
    currentParticipant: undefined,
  });

  return (
    <ParticipantsContext.Provider value={getParticipants}>
      <ModalContext.Provider value={{ state, setState }}>
        {children}
      </ModalContext.Provider>
    </ParticipantsContext.Provider>
  );
};
