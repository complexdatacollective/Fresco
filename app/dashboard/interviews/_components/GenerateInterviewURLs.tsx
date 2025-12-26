'use client';

import { FileUp } from 'lucide-react';
import { use, useEffect, useState } from 'react';
import superjson from 'superjson';
import { Button } from '~/components/ui/Button';
import { Skeleton } from '~/components/ui/skeleton';
import { Dialog } from '~/lib/dialogs/Dialog';
import SelectField from '~/lib/form/components/fields/Select';
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
        icon={<FileUp />}
      >
        Export Incomplete Interview URLs
      </Button>
      <Dialog
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
            <Skeleton className="h-10 w-full rounded" />
          ) : (
            <SelectField
              name="Protocol"
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
        </div>
      </Dialog>
    </>
  );
};
