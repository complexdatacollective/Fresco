'use client';

import { Copy } from 'lucide-react';
import { useState } from 'react';
import Paragraph from '~/components/typography/Paragraph';
import { Button } from '~/components/ui/Button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover';
import { useToast } from '~/components/ui/Toast';
import type { Participant, Protocol } from '~/lib/db/generated/client';
import SelectField from '~/lib/form/components/fields/Select/Native';
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

  const { promise } = useToast();

  const handleCopy = (url: string) => {
    if (url) {
      void promise(navigator.clipboard.writeText(url), {
        loading: 'Copying URL to clipboard...',
        success: 'URL copied to clipboard!',
        error: 'Failed to copy URL to clipboard.',
      });
    }
  };

  return (
    <Popover>
      <PopoverTrigger
        render={<Button size="sm" color="primary" icon={<Copy />} />}
      >
        Copy Unique URL
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

            setSelectedProtocol(null);
          }}
          value={selectedProtocol?.id}
          placeholder="Select a Protocol..."
        />
      </PopoverContent>
    </Popover>
  );
};
