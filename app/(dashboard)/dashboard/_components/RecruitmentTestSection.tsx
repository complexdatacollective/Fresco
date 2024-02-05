'use client';

import type { Participant, Protocol } from '@prisma/client';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Section from '~/components/layout/Section';
import { Button } from '~/components/ui/Button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import Heading from '~/components/ui/typography/Heading';
import Paragraph from '~/components/ui/typography/Paragraph';
import { api } from '~/trpc/client';
import { getBaseUrl } from '~/trpc/shared';

const RecruitmentTestSection = () => {
  const router = useRouter();

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

  const allowAnonymousRecruitment = !!appSettings?.allowAnonymousRecruitment;

  useEffect(() => {
    if (allowAnonymousRecruitment) {
      setSelectedParticipant(undefined);
    }
  }, [allowAnonymousRecruitment]);

  if (isLoadingAppSettings) {
    return <div>Loading...</div>;
  }

  const buttonDisabled =
    !selectedProtocol || (!allowAnonymousRecruitment && !selectedParticipant);

  const getInterviewURL = (): Route => {
    if (!selectedParticipant) {
      return `/onboard/${selectedProtocol?.id}` as Route;
    }

    return `/onboard/${selectedProtocol?.id}/?participantId=${selectedParticipant?.id}` as Route;
  };

  return (
    <Section>
      <Heading variant="h4">Recruitment Test Section</Heading>
      <Paragraph variant="noMargin" className="leading-normal">
        This section allows you to test recruitment.
      </Paragraph>
      <div className="flex gap-4">
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
      <Button
        disabled={buttonDisabled}
        onClick={() => router.push(getInterviewURL())}
      >
        Start Interview with GET
      </Button>
      <Button
        disabled={buttonDisabled}
        onClick={async () =>
          await fetch(getBaseUrl() + getInterviewURL(), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              participantId: selectedParticipant?.id,
            }),
          }).then((response) => {
            if (response.redirected) {
              window.location.href = response.url;
            }
          })
        }
      >
        Start Interview with POST
      </Button>
    </Section>
  );
};

export default RecruitmentTestSection;
