'use client';

import { useRouter } from 'next/navigation';
import { Button } from '~/components/ui/Button';

const UserMenu = () => {
  const router = useRouter();

  const doSignout = async () => {
    await fetch('/api/auth/signout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    router.refresh();
  };

  return (
    <div className="flex flex-row items-center gap-6">
      <Button onClick={() => void doSignout()}>Sign out</Button>
    </div>
  );
};

export default UserMenu;
