'use client';

import type { Protocol } from '@prisma/client';
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

const AnonymousRecruitmentTest = () => {
  const { data: appSettings, isLoading: isLoadingAppSettings } =
    api.appSettings.get.useQuery();
  const { data: protocolData, isLoading: isLoadingProtocols } =
    api.protocol.get.all.useQuery();
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol>();

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
      <h1 className="text-xl">Anonymous Recruitment Test Section</h1>
      <div className="flex justify-between">
        <p>Allow anonymous recruitment?</p>
        <RecruitmentSwitch />
      </div>
      <div></div>
      {appSettings?.allowAnonymousRecruitment && (
        <div className="flex">
          <Select
            onValueChange={(value) => {
              const protocol = protocols.find(
                (protocol) => protocol.id.toString() === value,
              );

              setSelectedProtocol(protocol);
            }}
            value={selectedProtocol?.id.toString()}
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

          {selectedProtocol && (
            <Link href={`/onboard/${selectedProtocol?.id}`}>
              <Button>
                Start anonymous interview using {selectedProtocol.name}
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default AnonymousRecruitmentTest;
