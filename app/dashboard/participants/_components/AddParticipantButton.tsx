import { Button } from '~/components/ui/Button';

import { type Participant } from '~/lib/db/generated/client';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import ParticipantModal from '~/app/dashboard/participants/_components/ParticipantModal';

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
      <Button onClick={() => setOpen(true)} icon={<Plus />}>
        Add Single Participant
      </Button>
    </div>
  );
}

export default AddParticipantButton;
