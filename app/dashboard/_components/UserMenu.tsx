'use client';

import { Button } from '~/components/ui/Button';
import { api } from '~/trpc/client';

const UserMenu = () => {
  const utils = api.useUtils();
  const { mutate: signOut, isLoading } = api.session.signOut.useMutation({
    onSuccess: async () => {
      await utils.session.get.invalidate();
    },
  });

  return (
    <Button
      disabled={isLoading}
      variant="secondary"
      size="sm"
      onClick={() => signOut()}
    >
      Sign out
    </Button>
  );
};

export default UserMenu;
