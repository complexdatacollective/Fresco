'use client';
import type { Participant, Protocol } from '@prisma/client';
import { useState, useEffect } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';

import { api } from '~/trpc/client';
import ExportCSVParticipantURLs from '~/app/(dashboard)/dashboard/participants/_components/ExportCSVParticipantURLs';

export const ExportParticipantUrlSection = () => {
  const { data: protocolData, isLoading: isLoadingProtocols } =
    api.protocol.get.all.useQuery();
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);

  const [selectedProtocol, setSelectedProtocol] = useState<Protocol>();

  const { data: participantData, isLoading: isLoadingParticipants } =
    api.participant.get.all.useQuery();

  useEffect(() => {
    if (protocolData) {
      setProtocols(protocolData);
    }
  }, [protocolData]);

  useEffect(() => {
    if (participantData) {
      setParticipants(participantData);
    }
  }, [participantData]);

  return (
    <div className="mt-6 flex w-1/3 flex-col gap-4 rounded-lg border border-solid p-6">
      <h1 className="text-xl">Generate Participation URLs</h1>
      <p className="text-sm text-muted-foreground">
        Generate a CSV of participation URLs for all participants by protocol.
        These URLs can be shared with participants to allow them to participate
        in your study.
      </p>
      <div className="flex flex-col gap-4">
        {/* Protocol selection */}
        <Select
          onValueChange={(value) => {
            const protocol = protocols.find(
              (protocol) => protocol.id === value,
            );

            setSelectedProtocol(protocol);
          }}
          value={selectedProtocol?.id}
          disabled={isLoadingProtocols}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a Protocol..." />
          </SelectTrigger>
          <SelectContent>
            {protocols?.map((protocol) => (
              <SelectItem key={protocol.id} value={protocol.id}>
                {protocol.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <ExportCSVParticipantURLs
          protocol={selectedProtocol}
          participants={participants}
          disabled={isLoadingParticipants || !selectedProtocol}
        />
      </div>
    </div>
  );
};
