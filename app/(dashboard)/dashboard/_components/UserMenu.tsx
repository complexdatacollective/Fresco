'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api } from '~/trpc/client';
import { Button } from '~/components/ui/Button';
import { useSession } from '~/providers/SessionProvider';

const UserMenu = () => {
  const { session } = useSession();
  const router = useRouter();

  const { mutate: doSignout, isLoading: isSigningOut } =
    api.session.signOut.useMutation({
      onSuccess: () => {
        router.refresh();
      },
      onError: (err) => {
        throw new Error(err.message);
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
