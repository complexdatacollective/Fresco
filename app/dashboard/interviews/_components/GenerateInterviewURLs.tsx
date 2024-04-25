'use client';

import { useState, useEffect, use, useRef } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import ExportCSVInterviewURLs from './ExportCSVInterviewURLs';
import { Skeleton } from '~/components/ui/skeleton';
import { Button } from '~/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { FileUp } from 'lucide-react';
import type { GetInterviewsReturnType } from '~/queries/interviews';
import type { Interview, Protocol } from '@prisma/client';
import type { GetProtocolsReturnType } from '~/queries/protocols';

export const GenerateInterviewURLs = ({
  interviews,
  protocolsPromise,
}: {
  interviews: Awaited<GetInterviewsReturnType>;
  protocolsPromise: GetProtocolsReturnType;
}) => {
  const protocols = use(protocolsPromise);

  const [interviewsToExport, setInterviewsToExport] = useState<Interview[]>([]);

  const [selectedProtocol, setSelectedProtocol] = useState<Protocol>();

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
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Incomplete Interview URLs</DialogTitle>
            <DialogDescription>
              Generate a CSV that contains unique interview URLs for all{' '}
              <strong>incomplete interviews </strong> by protocol. These URLs
              can be shared with participants to allow them to finish their
              interviews.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-end gap-4">
            {!protocols ? (
              <Skeleton className="h-10 w-full rounded-input" />
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
          <DialogFooter>
            <Button onClick={handleOpenChange} variant="outline">
              Cancel
            </Button>
            <ExportCSVInterviewURLs
              protocol={selectedProtocol}
              interviews={interviewsToExport}
              disabled={!selectedProtocol}
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
