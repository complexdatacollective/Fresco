'use client';

import { FileUp } from 'lucide-react';
import { use, useState, useTransition } from 'react';
import superjson from 'superjson';
import Paragraph from '@codaco/fresco-ui/typography/Paragraph';
import { Button } from '@codaco/fresco-ui/Button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@codaco/fresco-ui/Popover';
import { Skeleton } from '@codaco/fresco-ui/Skeleton';
import SelectField from '@codaco/fresco-ui/form/fields/Select/Native';
import { useToast } from '@codaco/fresco-ui/Toast';
import {
  getIncompleteInterviewUrlData,
  type IncompleteInterviewUrlData,
} from '~/actions/interviews';
import type {
  GetProtocolsQuery,
  GetProtocolsReturnType,
} from '~/queries/protocols';
import ExportCSVInterviewURLs from './ExportCSVInterviewURLs';

export const GenerateInterviewURLs = ({
  protocolsPromise,
  className,
}: {
  protocolsPromise: GetProtocolsReturnType;
  className?: string;
}) => {
  const rawProtocols = use(protocolsPromise);
  const protocols = superjson.parse<GetProtocolsQuery>(rawProtocols);
  const { add } = useToast();

  const [interviewsToExport, setInterviewsToExport] = useState<
    IncompleteInterviewUrlData[]
  >([]);

  const [selectedProtocol, setSelectedProtocol] =
    useState<(typeof protocols)[number]>();

  const [isLoading, startLoading] = useTransition();

  const handleSelectProtocol = (protocolId: string | number) => {
    const protocol = protocols.find((p) => p.id === protocolId);
    setSelectedProtocol(protocol);
    setInterviewsToExport([]);

    if (!protocol) return;

    startLoading(async () => {
      const result = await getIncompleteInterviewUrlData(protocol.id);
      if (result.error) {
        add({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
        return;
      }
      setInterviewsToExport(result.data);
    });
  };

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            icon={<FileUp />}
            className={className}
            data-testid="export-incomplete-urls-button"
          />
        }
      >
        Export Incomplete Interview URLs
      </PopoverTrigger>
      <PopoverContent className="flex max-w-sm flex-col gap-4">
        <Paragraph>
          Generate a CSV that contains unique interview URLs for all incomplete
          interviews by protocol.
        </Paragraph>

        {!protocols ? (
          <Skeleton className="h-10 w-full rounded" />
        ) : (
          <SelectField
            name="Protocol"
            size="sm"
            options={protocols.map((p) => ({ value: p.id, label: p.name }))}
            onChange={(value) => {
              if (value) handleSelectProtocol(value);
            }}
            value={selectedProtocol?.id}
            placeholder="Select a Protocol..."
          />
        )}
        <div className="flex justify-end">
          <ExportCSVInterviewURLs
            protocol={selectedProtocol}
            interviews={interviewsToExport}
            disabled={isLoading}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
};
