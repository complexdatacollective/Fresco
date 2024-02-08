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
import { getBaseUrl } from '~/trpc/shared';
import { useToast } from '~/components/ui/use-toast';

export const GetParticipantURLButton = ({
  participant,
}: {
  participant: Participant;
}) => {
  const { data: protocolData, isLoading: isLoadingProtocols } =
    api.protocol.get.all.useQuery();
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol>();
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (protocolData) {
      setProtocols(protocolData);
    }
  }, [protocolData]);

  const { toast } = useToast();

  const handleCopy = (url: string) => {
    if (url) {
      navigator.clipboard
        .writeText(url)
        .then(() => {
          toast({
            description: 'Copied to clipboard',
            variant: 'success',
            duration: 3000,
          });
        })
        .catch(() => {
          toast({
            title: 'Error',
            description: 'Could not copy text',
            variant: 'destructive',
          });
        });
    }
    setDialogOpen(false);
  };

  return (
    <Dialog open={dialogOpen}>
      <DialogTrigger asChild onClick={() => setDialogOpen(true)}>
        <Button size="sm">Get Participation URL</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Get Participation URL</DialogTitle>
          <DialogDescription>
            Generate a URL that can be shared with a participant to allow them
            to participate for a selected protocol.
          </DialogDescription>
        </DialogHeader>
        <>
          <div>
            <Select
              onValueChange={(value) => {
                const protocol = protocols.find(
                  (protocol) => protocol.id === value,
                );

                setSelectedProtocol(protocol);
                handleCopy(
                  `${getBaseUrl()}/onboard/${protocol?.id}/?participantId=${
                    participant.id
                  }`,
                );
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
        </>
      </DialogContent>
    </Dialog>
  );
};
