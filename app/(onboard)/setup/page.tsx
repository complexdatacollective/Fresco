import { revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { api } from '~/trpc/server';
import { getServerSession } from '~/utils/auth';
import { cn } from '~/utils/shadcn';
import { userFormClasses } from '../_shared';
import OnboardSteps from '../_components/OnboardSteps/StepsSidebar';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { steps } from '../_components/OnboardSteps/Steps';

async function Page({
  searchParams: { step = '1' },
}: {
  searchParams: {
    step?: string;
  };
}) {
  const stepInt = parseInt(step ?? '1', 10);

  const expired = await api.appSettings.get.expired.query(undefined, {
    context: {
      revalidate: 1,
    },
  });

  if (expired) {
    revalidateTag('appExpired');
  }

  const session = await getServerSession();

  // If we have a session already, skip the account signup step
  if (session && stepInt === 1) {
    redirect('/setup?step=2');
  }

  if (!session && stepInt > 1) {
    redirect('/setup?step=1');
  }

  console.log('step', step);

  const cardClasses = cn(userFormClasses, 'flex-row bg-transparent p-0 gap-6');
  const mainClasses = cn('bg-white flex w-full p-8 rounded-xl');

  const StepComponent = steps[stepInt - 1].component;

  const CustomModule = dynamic(
    () => import(`../_components/OnboardSteps/${StepComponent}`),
  );

  return (
    <div className={cardClasses}>
      <OnboardSteps currentStep={stepInt - 1} />
      <div className={mainClasses}>
        <Suspense fallback={<div>Loading...</div>}>
          <CustomModule />
        </Suspense>
      </div>
    </div>
  );
}

export default Page;
