import { type Dispatch, type SetStateAction } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/AlertDialog';

type FinishInterviewModalProps = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
};

const FinishInterviewModal = ({ open, setOpen }: FinishInterviewModalProps) => {
  const handleFinishInterview = () => {
    // redirect to thank you for participating page
    // mark session as finished by updating finishedAt
  };
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base">
            Are you sure you want finish the interview?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm">
            Your responses cannot be changed after you finish the interview.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={() => {
              setOpen(false);
            }}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              handleFinishInterview();
            }}
          >
            Finish Interview
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default FinishInterviewModal;
