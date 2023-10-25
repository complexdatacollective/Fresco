import { Button } from '~/components/ui/Button';

import { type Participant } from '@prisma/client';
import { useState } from 'react';
import ParticipantModal from '~/app/(dashboard)/dashboard/participants/_components/ParticipantModal';

interface AddParticipantButtonProps {
  existingParticipants: Participant[];
}

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
      <Button onClick={() => setOpen(true)}>Add Participant</Button>
    </div>
  );
}

export default AddParticipantButton;
