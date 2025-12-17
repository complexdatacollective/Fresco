'use client';

import type { Participant, Protocol } from '~/lib/db/generated/client';
import { useRef, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';

import { PopoverTrigger } from '@radix-ui/react-popover';
import { Check, Copy } from 'lucide-react';
import { Button } from '~/components/ui/Button';
import { Popover, PopoverContent } from '~/components/ui/popover';
import Paragraph from '~/components/ui/typography/Paragraph';
import { useToast } from '~/components/ui/use-toast';
import type { GetProtocolsReturnType } from '~/queries/protocols';

export const GenerateParticipationURLButton = ({
  participant,
  protocols,
}: {
  participant: Participant;
  protocols: Awaited<GetProtocolsReturnType>;
}) => {
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>();

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
              `${window.location.origin}/onboard/${protocol?.id}/?participantIdentifier=${participant.identifier}`,
            );

            ref.current?.click();

            setSelectedProtocol(null);
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
