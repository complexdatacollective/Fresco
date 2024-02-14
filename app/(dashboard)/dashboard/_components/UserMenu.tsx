'use client';

import { useAtomValue } from 'jotai';
import { Button } from '~/components/ui/Button';
import { isLoadingAtom } from '~/providers/SessionProvider';

const UserMenu = () => {
  const isLoading = useAtomValue(isLoadingAtom);

  return (
    <Button
      disabled={isLoading}
      variant="secondary"
      size="sm"
      onClick={() => {}}
    >
      Sign out
    </Button>
  );
};

export default UserMenu;
