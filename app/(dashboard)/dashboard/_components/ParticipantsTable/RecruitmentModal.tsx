'use client';
import type { Protocol } from '@prisma/client';
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
import ExportCSVParticipants from '../../participants/_components/ExportCSVParticipants';

export const RecruitmentModal = () => {
  const { data: protocolData, isLoading: isLoadingProtocols } =
    api.protocol.get.all.useQuery();
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol>();

  const { data: participants, isLoading: isLoadingParticipants } =
    api.participant.get.all.useQuery();

  useEffect(() => {
    if (protocolData) {
      setProtocols(protocolData);
    }
  }, [protocolData]);

  return (
    <Dialog onOpenChange={() => setSelectedProtocol(undefined)}>
      <DialogTrigger asChild>
        <Button>Participation URLs</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Participation URLs</DialogTitle>
          <DialogDescription>
            Generate a CSV of participation URLs for all participants by
            protocol.
          </DialogDescription>
        </DialogHeader>
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
          <ExportCSVParticipants
            protocolId={selectedProtocol?.id}
            participants={participants}
            disabled={isLoadingParticipants || !selectedProtocol}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
