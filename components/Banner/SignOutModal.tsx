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
} from '../ui/AlertDialog';
import { useAuth } from '@clerk/nextjs';

type SignOutModalProps = {
  openSignOutModal: boolean;
  setOpenSignOutModal: Dispatch<SetStateAction<boolean>>;
};

const SignOutModal = ({
  openSignOutModal,
  setOpenSignOutModal,
}: SignOutModalProps) => {
  const auth = useAuth();

  return (
    <AlertDialog open={openSignOutModal} onOpenChange={setOpenSignOutModal}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base">
            Are you sure you want to sign out?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm">
            This message is only shown when you are signed in to Fresco. It will
            not be seen by your participants. To continue hiding this message,
            you will be signed out.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setOpenSignOutModal(false)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={() => auth.signOut()}>
            Sign Out
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SignOutModal;
