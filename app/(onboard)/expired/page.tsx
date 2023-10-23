'use client';

import { env } from '~/env.mjs';
import { userFormClasses } from '../_shared';
import { Button } from '~/components/ui/Button';
import { useRouter } from 'next/navigation';
import { trpc } from '~/trpc/client';
import { Loader2 } from 'lucide-react';

export default function Page() {
  const router = useRouter();
  const { mutate: resetExpired, isLoading } =
    trpc.appSettings.reset.useMutation({
      onSuccess: () => {
        router.refresh();
      },
    });

  return (
    <div className={userFormClasses}>
      <h1 className="mb-4 text-2xl font-bold">Installation expired</h1>
      <p className="mb-6">
        You did not configure this deployment of Fresco in time, and it has now
        been locked down for your security.
      </p>
      <p>
        Please redploy a new instance of Fresco to continue using the software.
      </p>
      {env.NODE_ENV === 'development' && (
        <Button
          onClick={() => resetExpired()}
          disabled={isLoading}
          className="mt-6 max-w-[20rem]"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Dev mode: Reset Configuration
        </Button>
      )}
    </div>
  );
}
