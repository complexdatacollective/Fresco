'use client';

import { FileUp } from 'lucide-react';
import { use, useEffect, useState } from 'react';
import superjson from 'superjson';
import { Button } from '~/components/ui/Button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { Skeleton } from '~/components/ui/skeleton';
import { ControlledDialog } from '~/lib/dialogs/ControlledDialog';
import type { GetInterviewsQuery } from '~/queries/interviews';
import type {
  GetProtocolsQuery,
  GetProtocolsReturnType,
} from '~/queries/protocols';
import ExportCSVInterviewURLs from './ExportCSVInterviewURLs';

export const GenerateInterviewURLs = ({
  interviews,
  protocolsPromise,
}: {
  interviews: Awaited<GetInterviewsQuery>;
  protocolsPromise: GetProtocolsReturnType;
}) => {
  const rawProtocols = use(protocolsPromise);
  const protocols = superjson.parse<GetProtocolsQuery>(rawProtocols);

  const [interviewsToExport, setInterviewsToExport] = useState<
    typeof interviews
  >([]);

  const [selectedProtocol, setSelectedProtocol] =
    useState<(typeof protocols)[number]>();

  // Only export interviews that are 1. incomplete and 2. belong to the selected protocol
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

  const [open, setOpen] = useState(false);

  const handleOpenChange = () => {
    setOpen(!open);
  };

  return (
    <>
      <Button
        disabled={interviews?.length === 0}
        onClick={handleOpenChange}
        variant="outline"
      >
        <FileUp className="mr-2 inline-block h-4 w-4" />
        Export Incomplete Interview URLs
      </Button>
      <ControlledDialog
        open={open}
        closeDialog={handleOpenChange}
        title="Generate URLs for Incomplete Interviews"
        description="Generate a CSV that contains unique interview URLs for all incomplete interviews by protocol."
        footer={
          <>
            <Button onClick={handleOpenChange} variant="outline">
              Cancel
            </Button>
            <ExportCSVInterviewURLs
              protocol={selectedProtocol}
              interviews={interviewsToExport}
            />
          </>
        }
      >
        <div className="flex flex-col items-center justify-end gap-4">
          {!protocols ? (
            <Skeleton className="rounded-input h-10 w-full" />
          ) : (
            <Select
              onValueChange={(value) => {
                const protocol = protocols.find(
                  (protocol) => protocol.id === value,
                );

                setSelectedProtocol(protocol);
              }}
              value={selectedProtocol?.id}
            >
              <SelectTrigger className="w-full">
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
          )}
        </div>
      </ControlledDialog>
    </>
  );
};
