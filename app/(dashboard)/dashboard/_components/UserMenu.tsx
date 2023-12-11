'use client';

import { Button } from '~/components/ui/Button';
import { useSession } from '~/providers/SessionProvider';

const UserMenu = () => {
  const { signOut } = useSession();

  return (
    <div className="flex flex-row items-center gap-6">
      <Button onClick={() => void signOut()}>Sign out</Button>
    </div>
  );
};

export default UserMenu;
