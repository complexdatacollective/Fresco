import { Button } from '~/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog';
import ProtocolUploader from '~/app/(dashboard)/dashboard/_components/ProtocolUploader';
import { useState } from 'react';

interface ImportProtocolModalProps {
  onProtocolUploaded: () => void;
}

const ImportProtocolModal = ({
  onProtocolUploaded,
}: ImportProtocolModalProps) => {
  const [openModal, setOpenModal] = useState(false);

  const handleUploaded = () => {
    onProtocolUploaded();
    setOpenModal(false);
  };

  return (
    <Dialog open={openModal} onOpenChange={setOpenModal}>
      <DialogTrigger asChild>
        <Button variant="outline">Import protocol</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Protocol</DialogTitle>
          <ProtocolUploader onUploaded={handleUploaded} />
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default ImportProtocolModal;
