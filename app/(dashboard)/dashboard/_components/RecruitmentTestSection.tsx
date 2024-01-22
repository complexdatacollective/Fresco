'use client';

import type { Participant, Protocol } from '@prisma/client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import RecruitmentSwitch from '~/components/RecruitmentSwitch';
import { Button } from '~/components/ui/Button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { api } from '~/trpc/client';

const RecruitmentTestSection = () => {
  const { data: appSettings, isLoading: isLoadingAppSettings } =
    api.appSettings.get.useQuery();
  const { data: protocolData, isLoading: isLoadingProtocols } =
    api.protocol.get.all.useQuery();
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol>();
  const [selectedParticipant, setSelectedParticipant] = useState<Participant>();

  const { data: participants, isLoading: isLoadingParticipants } =
    api.participant.get.all.useQuery();

  useEffect(() => {
    if (protocolData) {
      setProtocols(protocolData);
    }
  }, [protocolData]);

  if (isLoadingAppSettings) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-muted p-6">
      <h1 className="text-xl">Recruitment Test Section</h1>
      <div className="flex justify-between">
        <p>Allow anonymous recruitment?</p>
        <RecruitmentSwitch />
      </div>
      <div className="flex">
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
      </div>
      <div className="flex">
        <Select
          onValueChange={(value) => {
            const participant = participants?.find(
              (participant) => participant.id === value,
            );

            setSelectedParticipant(participant);
          }}
          value={selectedParticipant?.id}
          disabled={isLoadingParticipants}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a Participant..." />
          </SelectTrigger>
          <SelectContent>
            {participants?.map((participant) => (
              <SelectItem key={participant.id} value={participant.id}>
                {participant.identifier}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Link
        href={`/onboard/${selectedProtocol?.id}/?participantId=${selectedParticipant?.id}`}
      >
        <Button>
          Start interview using {selectedParticipant?.identifier} and{' '}
          {selectedProtocol?.name}
        </Button>
      </Link>
    </div>
  );
};

export default RecruitmentTestSection;
