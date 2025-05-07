'use client';
import { useEffect, useState } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';

import { FileUp } from 'lucide-react';
import type { ParticipantWithInterviews } from '~/app/dashboard/_components/ParticipantsTable/ParticipantsTableClient';
import type { ProtocolWithInterviews } from '~/app/dashboard/_components/ProtocolsTable/ProtocolsTableClient';
import { Button } from '~/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import FancyBox from '~/components/ui/FancyBox';
import ExportCSVParticipantURLs from './ExportCSVParticipantURLs';

export const GenerateParticipantURLs = ({
  protocols,
  participants,
}: {
  protocols: ProtocolWithInterviews[];
  participants: ParticipantWithInterviews[];
}) => {
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    [],
  );

  const [selectedProtocol, setSelectedProtocol] =
    useState<ProtocolWithInterviews>();

  // Default to all participants selected
  useEffect(() => {
    if (participants) {
      setSelectedParticipants(participants.map((p) => p.id));
    }
  }, [participants]);

  const [open, setOpen] = useState(false);

  const handleOpenChange = () => {
    setOpen(!open);
  };

  return (
    <>
      <Button
        disabled={participants?.length === 0}
        onClick={handleOpenChange}
        variant="outline"
      >
        <FileUp className="mr-2 inline-block h-4 w-4" />
        Export Participation URLs
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Participation URLs</DialogTitle>
            <DialogDescription>
              Generate a CSV that contains{' '}
              <strong>unique participation URLs</strong> for all participants by
              protocol. These URLs can be shared with participants to allow them
              to take your interview.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-end gap-4">
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
            <FancyBox
              items={participants.map((participant) => ({
                id: participant.id,
                label: participant.identifier,
                value: participant.id,
              }))}
              placeholder="Select Participants..."
              singular="Participant"
              plural="Participants"
              value={selectedParticipants}
              onValueChange={setSelectedParticipants}
            />
          </div>
          <DialogFooter>
            <Button onClick={handleOpenChange} variant="outline">
              Cancel
            </Button>
            <ExportCSVParticipantURLs
              protocol={selectedProtocol}
              participants={selectedParticipants.map(
                (id) => participants.find((p) => p.id === id)!,
              )}
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
