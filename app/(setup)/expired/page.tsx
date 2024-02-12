import { env } from '~/env.mjs';
import { containerClasses } from '../_components/schemas';
import { resetAppSettings } from '~/app/_actions';
import SubmitButton from '~/components/ui/SubmitButton';

export default function Page() {
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
        <form action={resetAppSettings}>
          <SubmitButton className="mt-6 max-w-[20rem]" type="submit">
            Dev mode: Reset Configuration
          </SubmitButton>
        </form>
      )}
    </div>
  );
}
