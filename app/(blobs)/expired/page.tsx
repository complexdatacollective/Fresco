import { redirect } from 'next/navigation';
import { resetAppSettings } from '~/actions/reset';
import { containerClasses } from '~/components/ContainerClasses';
import { Button } from '~/components/ui/Button';
import { env } from '~/env';
import { isAppExpired } from '~/queries/appSettings';

export default async function Page() {
  const isExpired = await isAppExpired();

  if (!isExpired) {
    redirect('/');
  }

  return (
    <div className={containerClasses}>
      <h1 className="mb-4 text-2xl font-bold">Installation expired</h1>
      <p className="mb-6">
        You did not configure this deployment of Fresco in time, and it has now
        been locked down for your security.
      </p>
      <p>
        Please redeploy a new instance of Fresco to continue using the software.
      </p>
      {env.NODE_ENV === 'development' && (
        <Button className="mt-6 max-w-[20rem]" onClick={resetAppSettings}>
          Dev mode: Reset Configuration
        </Button>
      )}
    </div>
  );
}
