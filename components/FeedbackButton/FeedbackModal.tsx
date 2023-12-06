import { type Dispatch, type SetStateAction } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';

type FeedbackModalProps = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
};

const FeedbackModal = ({ open, setOpen }: FeedbackModalProps) => {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Your feedback below</DialogTitle>
        </DialogHeader>
        <iframe
          className="h-[450px] w-full border"
          title="Feedback form"
          src="https://forms.clickup.com/3464225/f/39q11-6131/OIJSIULQV2EUZFLUOA"
        ></iframe>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackModal;
