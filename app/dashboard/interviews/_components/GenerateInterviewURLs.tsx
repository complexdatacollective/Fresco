'use client';

import { FileUp } from 'lucide-react';
import { use, useEffect, useState } from 'react';
import superjson from 'superjson';
import Paragraph from '~/components/ui/typography/Paragraph';
import { Button } from '~/components/ui/Button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover';
import { Skeleton } from '~/components/ui/skeleton';
import SelectField from '~/components/ui/form/components/fields/Select/Native';
import type { GetInterviewsQuery } from '~/queries/interviews';
import type {
  GetProtocolsQuery,
  GetProtocolsReturnType,
} from '~/queries/protocols';
import ExportCSVInterviewURLs from './ExportCSVInterviewURLs';

export const GenerateInterviewURLs = ({
  interviews,
  protocolsPromise,
  className,
}: {
  interviews: Awaited<GetInterviewsQuery>;
  protocolsPromise: GetProtocolsReturnType;
  className?: string;
}) => {
  const rawProtocols = use(protocolsPromise);
  const protocols = superjson.parse<GetProtocolsQuery>(rawProtocols);

  const [interviewsToExport, setInterviewsToExport] = useState<
    typeof interviews
  >([]);

  const [selectedProtocol, setSelectedProtocol] =
    useState<(typeof protocols)[number]>();

  useEffect(() => {
    if (interviews) {
      setInterviewsToExport(
        interviews.filter(
          (interview) =>
            !interview.finishTime &&
            selectedProtocol?.id === interview.protocolId,
        ),
      );
    }
  }, [interviews, selectedProtocol]);

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            disabled={interviews?.length === 0}
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
            options={protocols?.map((p) => ({ value: p.id, label: p.name }))}
            onChange={(value) => {
              const protocol = protocols.find(
                (protocol) => protocol.id === value,
              );

              setSelectedProtocol(protocol);
            }}
            value={selectedProtocol?.id}
            placeholder="Select a Protocol..."
          />
        )}
        <div className="flex justify-end">
          <ExportCSVInterviewURLs
            protocol={selectedProtocol}
            interviews={interviewsToExport}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
};
