'use client';

import { type Dispatch, type SetStateAction } from 'react';
import { logout } from '~/actions/auth';
import { ControlledDialog } from '~/lib/dialogs/ControlledDialog';
import Button from '../ui/Button';

type SignOutModalProps = {
  openSignOutModal: boolean;
  setOpenSignOutModal: Dispatch<SetStateAction<boolean>>;
};

const SignOutModal = ({
  openSignOutModal,
  setOpenSignOutModal,
}: SignOutModalProps) => {
  return (
    <ControlledDialog
      open={openSignOutModal}
      closeDialog={() => setOpenSignOutModal(false)}
      title="Are you sure you want to sign out?"
      description="This banner is only shown when you are signed in to the dashboard. It will not be seen by your participants. To hide this banner, you will be signed out."
      footer={
        <>
          <Button onClick={() => setOpenSignOutModal(false)}>Cancel</Button>
          <Button color="primary" onClick={() => logout()}>
            Sign Out and Hide Banner
          </Button>
        </>
      }
    />
  );
};

export default SignOutModal;
