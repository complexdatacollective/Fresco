import { useEffect, useState } from 'react';

import { Button } from '~/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import type { Participant } from '@prisma/client';
import { ScrollArea } from '~/components/ui/scroll-area';

type ParticipantSelectionDropdownProps = {
  participants: Participant[];
  disabled: boolean;
  setParticipantsToExport: (participants: Participant[]) => void;
};

export function ParticipantSelectionDropdown({
  participants,
  disabled,
  setParticipantsToExport,
}: ParticipantSelectionDropdownProps) {
  const [selectedParticipants, setSelectedParticipants] = useState<
    Participant[]
  >([]);

  useEffect(() => {
    setSelectedParticipants(participants);
  }, [participants, setParticipantsToExport]);

  useEffect(() => {
    setParticipantsToExport(selectedParticipants);
  }, [selectedParticipants, setParticipantsToExport]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button disabled={disabled} variant="outline">
          {selectedParticipants.length === participants.length
            ? 'All Participants Selected'
            : `${selectedParticipants.length} Participants Selected`}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-auto">
        <ScrollArea className="h-72 w-auto">
          <DropdownMenuLabel>Participants</DropdownMenuLabel>
          <div className="flex flex-row gap-2 p-2">
            <div className="text-sm">
              {selectedParticipants.length} selected
            </div>
            <Button
              size="xs"
              onClick={() => setSelectedParticipants(participants)}
            >
              Select All
            </Button>
            <Button
              variant="destructive"
              size="xs"
              onClick={() => setSelectedParticipants([])}
            >
              Clear
            </Button>
          </div>

          <DropdownMenuSeparator />

          {/* loop through all participants and render a dropdown menu checkbox item for them */}
          {participants.map((participant) => {
            return (
              <DropdownMenuCheckboxItem
                key={participant.id}
                checked={selectedParticipants.includes(participant)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedParticipants([
                      ...selectedParticipants,
                      participant,
                    ]);
                  } else {
                    setSelectedParticipants(
                      selectedParticipants.filter(
                        (selectedParticipant) =>
                          selectedParticipant !== participant,
                      ),
                    );
                  }
                }}
              >
                {participant.identifier}
              </DropdownMenuCheckboxItem>
            );
          })}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
