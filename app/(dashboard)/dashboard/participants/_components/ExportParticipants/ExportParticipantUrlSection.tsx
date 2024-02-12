'use client';
import { useState, useEffect } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';

import { api } from '~/trpc/client';
import ExportCSVParticipantURLs from '~/app/(dashboard)/dashboard/participants/_components/ExportParticipants/ExportCSVParticipantURLs';
import Paragraph from '~/components/ui/typography/Paragraph';
import SettingsSection from '~/components/layout/SettingsSection';
import { Skeleton } from '~/components/ui/skeleton';
import FancyBox from '~/components/ui/FancyBox';
import { type RouterOutputs } from '~/trpc/shared';
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

export const GenerateParticipantURLs = () => {
  const { data: protocols, isLoading: isLoadingProtocols } =
    api.protocol.get.all.useQuery();

  const { data: participants, isLoading: isLoadingParticipants } =
    api.participant.get.all.useQuery();

  const [selectedParticipants, setSelectedParticipants] = useState<
    RouterOutputs['participant']['get']['all'][0]['id'][]
  >([]);

  const [selectedProtocol, setSelectedProtocol] =
    useState<RouterOutputs['protocol']['get']['all'][0]>();

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
      <Button onClick={handleOpenChange} variant="outline">
        <FileUp className="mr-2 inline-block h-4 w-4" />
        Export Participation URLs
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Participation URLs</DialogTitle>
            <DialogDescription>
              Generate a CSV that contains{' '}
              <strong>unique participation URLs</strong> for all participants by
              protocol. These URLs can be shared with participants to allow them
              to take your interview.
            </DialogDescription>
          </DialogHeader>
          <div className="flex w-72 flex-col items-center justify-end gap-4">
            {isLoadingProtocols || !protocols ? (
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
                disabled={isLoadingProtocols}
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
            {isLoadingParticipants || !participants ? (
              <Skeleton className="rounded-input h-10 w-full " />
            ) : (
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
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleOpenChange}>Cancel</Button>
            <ExportCSVParticipantURLs
              protocol={selectedProtocol!}
              participants={
                selectedParticipants.map(
                  (id) => participants?.find((p) => p.id === id),
                ) as RouterOutputs['participant']['get']['all'][0][]
              }
              disabled={!selectedParticipants || !selectedProtocol}
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
