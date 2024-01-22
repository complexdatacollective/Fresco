import { type Dispatch, type SetStateAction } from 'react';
import { useSession } from '~/providers/SessionProvider';
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

type SignOutModalProps = {
  openSignOutModal: boolean;
  setOpenSignOutModal: Dispatch<SetStateAction<boolean>>;
};

const SignOutModal = ({
  openSignOutModal,
  setOpenSignOutModal,
}: SignOutModalProps) => {
  const { signOut } = useSession();

  return (
    <AlertDialog open={openSignOutModal} onOpenChange={setOpenSignOutModal}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base">
            Are you sure you want to sign out?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm">
            This banner is only shown when you are signed in to the dashboard.
            It will not be seen by your participants. To hide this banner, you
            will be signed out.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setOpenSignOutModal(false)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={() => void signOut()}>
            Sign Out and Hide Banner
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SignOutModal;
