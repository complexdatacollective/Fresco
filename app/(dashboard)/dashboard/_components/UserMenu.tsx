'use client';

import { Button } from '~/components/ui/Button';
import { useSession } from '~/providers/SessionProvider';

const UserMenu = () => {
  const { signOut } = useSession();

  return <Button onClick={() => void signOut()}>Sign out</Button>;
};

export default UserMenu;
