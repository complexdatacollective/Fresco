import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { type Dispatch, type SetStateAction } from 'react';
import { Sheet, SheetContent, SheetTitle } from '~/components/ui/sheet';

type FeedbackModalProps = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
};

const FeedbackModal = ({ open, setOpen }: FeedbackModalProps) => {
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        aria-describedby={undefined}
        className="w-[40rem] bg-[#f7f8f9] p-0"
      >
        {/* Title is required by radix for accessibility purposes,
            so using VisuallyHidden component to hide it from UI as suggested in the warning */}
        <VisuallyHidden.Root>
          <SheetTitle>Feedback and Issue Report Form</SheetTitle>
        </VisuallyHidden.Root>
        <iframe
          className="h-[100dvh] w-full"
          title="Feedback form"
          src="https://forms.clickup.com/3464225/f/39q11-6131/OIJSIULQV2EUZFLUOA"
        ></iframe>
      </SheetContent>
    </Sheet>
  );
};

export default FeedbackModal;
