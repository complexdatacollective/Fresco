'use client';

import type { Participant } from '@prisma/client';
import { createContext, useContext, useEffect, useState } from 'react';

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
  return (
    <ParticipantsContext.Provider value={getParticipants}>
      {children}
    </ParticipantsContext.Provider>
  );
};
