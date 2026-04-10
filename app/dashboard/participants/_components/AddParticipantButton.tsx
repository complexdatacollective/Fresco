import { Button } from '~/components/ui/Button';

import { Plus } from 'lucide-react';
import { useState } from 'react';
import ParticipantModal from '~/app/dashboard/participants/_components/ParticipantModal';
import { type Participant } from '~/lib/db/generated/client';

type AddParticipantButtonProps = {
  existingParticipants: Participant[];
};

function AddParticipantButton({
  existingParticipants,
}: AddParticipantButtonProps) {
  const [isOpen, setOpen] = useState(false);

  return (
    <>
      <ParticipantModal
        open={isOpen}
        setOpen={setOpen}
        existingParticipants={existingParticipants}
      />
      <Button onClick={() => setOpen(true)} icon={<Plus />} className="w-full">
        Add Single Participant
      </Button>
    </>
  );
}

export default AddParticipantButton;
