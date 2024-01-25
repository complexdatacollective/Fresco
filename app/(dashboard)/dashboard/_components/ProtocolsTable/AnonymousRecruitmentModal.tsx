'use client';
import type { Protocol } from '@prisma/client';
import { useState, useEffect } from 'react';
import RecruitmentSwitch from '~/components/RecruitmentSwitch';
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
  const { data: appSettings } = api.appSettings.get.useQuery();
  const { data: protocolData, isLoading: isLoadingProtocols } =
    api.protocol.get.all.useQuery();
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol>();

  const allowAnonymousRecruitment = !!appSettings?.allowAnonymousRecruitment;

  useEffect(() => {
    if (protocolData) {
      setProtocols(protocolData);
    }
  }, [protocolData]);

  const url = `${getBaseUrl()}/onboard/${selectedProtocol?.id}`;

  return (
    <Dialog>
      <DialogTrigger>
        <Button>Anonymous Recruitment</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Anonymous Recruitment</DialogTitle>
          <DialogDescription>
            If anonymous recruitment is enabled, you may generate an anonymous
            recruitment URL.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-between">
          <p>Allow anonymous recruitment?</p>
          <RecruitmentSwitch />
        </div>
        {allowAnonymousRecruitment && (
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
              <div className="flex flex-row justify-between rounded-md bg-secondary p-4">
                {url}
                <Button variant="ghost" size="icon">
                  <CopyButton text={url} />
                </Button>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
