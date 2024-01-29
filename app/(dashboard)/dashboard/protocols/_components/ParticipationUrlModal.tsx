'use client';
import type { Participant, Protocol } from '@prisma/client';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';

import { Button } from '~/components/ui/Button';
import { api } from '~/trpc/client';
import ExportCSVParticipants from '~/app/(dashboard)/dashboard/participants/_components/ExportCSVParticipantURLs';
import { ParticipantSelectionDropdown } from '~/app/(dashboard)/dashboard/_components/ParticipantSelectionDropdown';

export const ParticipationUrlModal = () => {
  const { data: protocolData, isLoading: isLoadingProtocols } =
    api.protocol.get.all.useQuery();
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [participantsToExport, setParticipantsToExport] = useState<
    Participant[] | undefined
  >([]);
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
    <Dialog onOpenChange={() => setSelectedProtocol(undefined)}>
      <DialogTrigger asChild>
        <Button>Export Participation URLs</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Participation URLs</DialogTitle>
          <DialogDescription>
            Generate a CSV of participation URLs for selected participants by
            protocol.
          </DialogDescription>
        </DialogHeader>
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

          <ParticipantSelectionDropdown
            participants={participants}
            disabled={!selectedProtocol}
            setParticipantsToExport={setParticipantsToExport}
          />

          <ExportCSVParticipants
            protocol={selectedProtocol}
            participants={participantsToExport}
            disabled={isLoadingParticipants || !selectedProtocol}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
