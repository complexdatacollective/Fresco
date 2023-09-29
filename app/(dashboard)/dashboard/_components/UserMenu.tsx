'use client';

import { Loader2 } from 'lucide-react';
import { Button } from '~/components/ui/Button';
import { useSession } from '~/contexts/SessionProvider';
import { trpcReact } from '~/app/_trpc/client';

const UserMenu = () => {
  const { session, isLoading } = useSession();

  const { mutate: signOut, isPending: isSigningOut } =
    trpcReact.session.signOut.useMutation();

  return (
    <div className="flex flex-row items-center gap-6">
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {session && <span>{session?.user.username}</span>}
      <Button type="submit" disabled={isLoading} onClick={() => signOut()}>
        {isSigningOut && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Sign out
      </Button>
    </div>
  );
};

export default UserMenu;
