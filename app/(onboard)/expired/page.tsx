import { env } from '~/env.mjs';
import { userFormClasses } from '../_shared';
import { Button } from '~/components/ui/Button';
import { prisma } from '~/utils/db';
import { redirect } from 'next/navigation';

export default function Page() {
  const handleResetSetup = async () => {
    'use server';
    // eslint-disable-next-line local-rules/require-data-mapper
    await prisma.setupMetadata.deleteMany();
    redirect('/');
  };

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
        <form action={void handleResetSetup} className="mt-6">
          <Button type="submit">Dev mode: Reset Configuration</Button>
        </form>
      )}
    </div>
  );
}
