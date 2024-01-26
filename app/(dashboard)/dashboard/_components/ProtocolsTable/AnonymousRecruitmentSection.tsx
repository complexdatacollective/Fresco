'use client';
import type { Protocol } from '@prisma/client';
import { useState, useEffect } from 'react';
import RecruitmentSwitch from '~/components/RecruitmentSwitch';

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

export const AnonymousRecruitmentSection = () => {
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

  useEffect(() => {
    if (!allowAnonymousRecruitment) {
      setSelectedProtocol(undefined);
    }
  }, [allowAnonymousRecruitment]);

  const url = `${getBaseUrl()}/onboard/${selectedProtocol?.id}`;

  return (
    <div className="flex w-1/3 flex-col gap-4 rounded-lg border border-solid p-6">
      <div>
        <h1 className="pb-2 text-xl">Anonymous Recruitment</h1>
        <p className="text-sm text-muted-foreground">
          If anonymous recruitment is enabled, you may generate an anonymous
          recruitment URL. This URL can be shared with participants to allow
          them to self-enroll in your study.
        </p>
      </div>

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
            <div className="flex flex-row items-center justify-between gap-2 rounded-md bg-secondary p-4">
              <div className="break-all">{url}</div>
              <Button variant="ghost" size="icon">
                <CopyButton text={url} />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
