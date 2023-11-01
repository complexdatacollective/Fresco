'use client';

import { Loader2 } from 'lucide-react';
import { Button } from '~/components/ui/Button';
import { useSession } from '~/providers/SessionProvider';

const UserMenu = () => {
  const { signOut, isLoading } = useSession();

  return (
    <div className="flex flex-row items-center gap-6">
      <Button onClick={() => void signOut()} disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Sign out
      </Button>
    </div>
  );
};

export default UserMenu;
