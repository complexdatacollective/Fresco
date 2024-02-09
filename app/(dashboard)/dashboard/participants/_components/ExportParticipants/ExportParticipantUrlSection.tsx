'use client';
import { useState, useEffect } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';

import { api } from '~/trpc/client';
import ExportCSVParticipantURLs from '~/app/(dashboard)/dashboard/participants/_components/ExportParticipants/ExportCSVParticipantURLs';
import Paragraph from '~/components/ui/typography/Paragraph';
import SettingsSection from '~/components/layout/SettingsSection';
import { Skeleton } from '~/components/ui/skeleton';
import FancyBox from '~/components/ui/FancyBox';
import { type RouterOutputs } from '~/trpc/shared';

export const ExportParticipantUrlSection = () => {
  const { data: protocols, isLoading: isLoadingProtocols } =
    api.protocol.get.all.useQuery();

  const { data: participants, isLoading: isLoadingParticipants } =
    api.participant.get.all.useQuery();

  const [selectedParticipants, setSelectedParticipants] = useState<
    RouterOutputs['participant']['get']['all'][0]['id'][]
  >([]);

  const [selectedProtocol, setSelectedProtocol] =
    useState<RouterOutputs['protocol']['get']['all'][0]>();

  // Default to all participants selected
  useEffect(() => {
    if (participants) {
      setSelectedParticipants(participants.map((p) => p.id));
    }
  }, [participants]);

  return (
    <SettingsSection
      heading="Generate Participation URLs"
      controlArea={
        <div className="flex w-72 flex-col items-center justify-end gap-4">
          {isLoadingProtocols || !protocols ? (
            <Skeleton className="rounded-input h-10 w-full" />
          ) : (
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
              <SelectTrigger className="w-full">
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
          )}
          {isLoadingParticipants || !participants ? (
            <Skeleton className="rounded-input h-10 w-full " />
          ) : (
            <FancyBox
              items={participants.map((participant) => ({
                id: participant.id,
                label: participant.identifier,
                value: participant.id,
              }))}
              placeholder="Select Participants..."
              singular="Participant"
              plural="Participants"
              value={selectedParticipants}
              onValueChange={setSelectedParticipants}
            />
          )}
          <ExportCSVParticipantURLs
            protocol={selectedProtocol!}
            participants={
              selectedParticipants.map(
                (id) => participants?.find((p) => p.id === id),
              ) as RouterOutputs['participant']['get']['all'][0][]
            }
            disabled={!selectedParticipants || !selectedProtocol}
          />
        </div>
      }
    >
      <Paragraph>
        Generate a CSV of participation URLs for all participants by protocol.
        These URLs can be shared with participants to allow them to participate
        in your study.
      </Paragraph>
    </SettingsSection>
  );
};
