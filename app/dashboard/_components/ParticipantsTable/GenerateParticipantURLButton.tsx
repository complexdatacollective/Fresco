import type { Participant, Protocol } from '@prisma/client';
import { useState, useEffect, useRef, Suspense, use } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';

import { Button } from '~/components/ui/Button';
import { useToast } from '~/components/ui/use-toast';
import { Popover, PopoverContent } from '~/components/ui/popover';
import { PopoverTrigger } from '@radix-ui/react-popover';
import Paragraph from '~/components/ui/typography/Paragraph';
import { Check, Copy } from 'lucide-react';
import { prisma } from '~/utils/db';

async function getProtocolData() {
  const protocolData = await prisma.protocol.findMany();
  return protocolData;
}

export default function GenerateParticipantURLButton({
  participant,
}: {
  participant: Participant;
}) {
  const protocolPromise = getProtocolData();

  return (
    <Suspense fallback="loading...">
      <GenerateParticipationURLButtonClient
        participant={participant}
        protocolPromise={protocolPromise}
      />
    </Suspense>
  );
}

export const GenerateParticipationURLButtonClient = ({
  participant,
  protocolPromise,
}: {
  participant: Participant;
  protocolPromise: ReturnType<typeof getProtocolData>;
}) => {
  const protocols = use(protocolPromise);

  const [selectedProtocol, setSelectedProtocol] = useState<Protocol>();

  const { toast } = useToast();

  const handleCopy = (url: string) => {
    if (url) {
      navigator.clipboard
        .writeText(url)
        .then(() => {
          toast({
            title: 'Success!',
            icon: <Check />,
            description: 'Participation URL copied to clipboard',
            variant: 'success',
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
  };

  const ref = useRef<HTMLButtonElement>(null);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="xs" ref={ref} variant="accent">
          <Copy className="mr-2 h-4 w-4" />
          Copy Unique URL
        </Button>
      </PopoverTrigger>
      <PopoverContent className="flex flex-col gap-2">
        <Paragraph variant="smallText">
          Select a protocol, and the URL will be copied to your clipboard.
        </Paragraph>
        <Select
          onValueChange={(value) => {
            const protocol = protocols.find(
              (protocol) => protocol.id === value,
            );

            setSelectedProtocol(protocol);
            handleCopy(
              `/onboard/${protocol?.id}/?participantIdentifier=${participant.identifier}`,
            );

            ref.current?.click();
          }}
          value={selectedProtocol?.id}
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
      </PopoverContent>
    </Popover>
  );
};
