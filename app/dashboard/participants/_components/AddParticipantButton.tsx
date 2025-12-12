import { Button } from '~/components/ui/Button';

import { type Participant } from '~/lib/db/generated/client';
import { useState } from 'react';
import ParticipantModal from '~/app/dashboard/participants/_components/ParticipantModal';
import { Plus } from 'lucide-react';

type AddParticipantButtonProps = {
  existingParticipants: Participant[];
};

function AddParticipantButton({
  existingParticipants,
}: AddParticipantButtonProps) {
  const [isOpen, setOpen] = useState(false);

  return (
    <div>
      <ParticipantModal
        open={isOpen}
        setOpen={setOpen}
        existingParticipants={existingParticipants}
      />
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 inline-block h-4 w-4" />
        Add Single Participant
      </Button>
    </div>
  );
}

export default AddParticipantButton;
