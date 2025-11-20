'use client';

import type { Participant, Protocol } from '@prisma/client';
import { Check, Copy } from 'lucide-react';
import { useRef, useState } from 'react';
import Paragraph from '~/components/typography/Paragraph';
import { Button } from '~/components/ui/Button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover';
import { useToast } from '~/components/ui/use-toast';
import { SelectField } from '~/lib/form/components/fields/Select';
import type { ProtocolWithInterviews } from '../ProtocolsTable/ProtocolsTableClient';

export const GenerateParticipationURLButton = ({
  participant,
  protocols,
}: {
  participant: Participant;
  protocols: ProtocolWithInterviews[];
}) => {
  const [selectedProtocol, setSelectedProtocol] =
    useState<Partial<Protocol> | null>();

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
      <PopoverTrigger>
        <Button size="sm" ref={ref} color="primary">
          <Copy className="mr-2 h-4 w-4" />
          Copy Unique URL
        </Button>
      </PopoverTrigger>
      <PopoverContent className="flex flex-col gap-2">
        <Paragraph intent="smallText">
          Select a protocol, and the URL will be copied to your clipboard.
        </Paragraph>
        <SelectField
          name="protocol"
          options={protocols.map((p) => ({ value: p.id, label: p.name }))}
          onChange={(value) => {
            const protocol = protocols.find(
              (protocol) => protocol.id === value,
            ) as Protocol;

            setSelectedProtocol(protocol);
            handleCopy(
              `${window.location.origin}/onboard/${protocol?.id}/?participantIdentifier=${participant.identifier}`,
            );

            ref.current?.click();

            setSelectedProtocol(null);
          }}
          value={selectedProtocol?.id}
          placeholder="Select a Protocol..."
        />
      </PopoverContent>
    </Popover>
  );
};
