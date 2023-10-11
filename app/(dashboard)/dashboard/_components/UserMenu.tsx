'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { trpc } from '~/app/_trpc/client';
import { Button } from '~/components/ui/Button';
import { useSession } from '~/providers/SessionPrivider';

const UserMenu = () => {
  const { session } = useSession();
  const router = useRouter();

  const { mutate: doSignout, isLoading: isSigningOut } =
    trpc.session.signOut.useMutation({
      onSuccess: () => {
        router.refresh();
      },
    });

  return (
    <div className="flex flex-row items-center gap-6">
      {session && <span>{session?.user.username}</span>}
      <Button onClick={() => void doSignout()} disabled={isSigningOut}>
        {isSigningOut && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Sign out
      </Button>
    </div>
  );
};

export default UserMenu;
