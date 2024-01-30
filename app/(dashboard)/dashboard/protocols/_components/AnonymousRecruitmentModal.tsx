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
import { getBaseUrl } from '~/trpc/shared';
import CopyButton from '~/app/(dashboard)/dashboard/_components/ProtocolsTable/CopyButton';

export const AnonymousRecruitmentModal = () => {
  const { data: protocolData, isLoading: isLoadingProtocols } =
    api.protocol.get.all.useQuery();
  const [protocols, setProtocols] = useState<Protocol[]>([]);

  const [selectedProtocol, setSelectedProtocol] = useState<Protocol>();

  const { data: appSettings } = api.appSettings.get.useQuery();

  const allowAnonymousRecruitment = !!appSettings?.allowAnonymousRecruitment;

  useEffect(() => {
    if (protocolData) {
      setProtocols(protocolData);
    }
  }, [protocolData]);

  const url = `${getBaseUrl()}/onboard/${selectedProtocol?.id}`;

  return (
    <Dialog onOpenChange={() => setSelectedProtocol(undefined)}>
      <DialogTrigger asChild>
        <Button disabled={!allowAnonymousRecruitment}>
          Generate Anonymous Participation URL
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Anonymous Participation URL</DialogTitle>
          <DialogDescription>
            Generate an anonymous participation URL for a protocol. This URL can
            be shared with participants to allow them to self-enroll in your
            study.
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
          {selectedProtocol && (
            <div className="flex flex-row items-center justify-between gap-2 rounded-md bg-secondary p-4">
              <div className="break-al text-base">{url}</div>
              <Button variant="ghost" size="icon">
                <CopyButton text={url} />
              </Button>
            </div>
          )}
        </>
      </DialogContent>
    </Dialog>
  );
};
