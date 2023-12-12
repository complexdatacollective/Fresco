import { type Dispatch, type SetStateAction } from 'react';
import { Sheet, SheetContent } from '~/components/ui/sheet';

type FeedbackModalProps = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
};

const FeedbackModal = ({ open, setOpen }: FeedbackModalProps) => {
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side={'top'}>
        <iframe
          className="mt-1 h-[100dvh] w-full py-2"
          title="Feedback form"
          src="https://forms.clickup.com/3464225/f/39q11-6131/OIJSIULQV2EUZFLUOA"
        ></iframe>
      </SheetContent>
    </Sheet>
  );
};

export default FeedbackModal;
