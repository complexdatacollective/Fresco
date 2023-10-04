'use client';

import {
  type Step,
  steps,
} from '~/app/(onboard)/_components/OnboardSteps/Steps';
import { cn } from '~/utils/shadcn';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import OnboardSteps from './OnboardSteps/StepsSidebar';
import { userFormClasses } from '../_shared';
import { useSession } from '~/providers/SessionPrivider';
import { useEffect } from 'react';
import type { Route } from 'next';
import { trpc } from '~/app/_trpc/client';

function OnboardWizard() {
  const { session } = useSession();
  const pathname = usePathname() as Route;
  const router = useRouter();
  const searchParams = useSearchParams();
  const step = searchParams.get('step');
  const stepInt = parseInt(step ?? '1', 10);

  const { data: expired } = trpc.metadata.get.expired.useQuery(undefined, {
    refetchInterval: 1000 * 10,
  });

  useEffect(() => {
    if (expired) {
      router.refresh();
    }

    if (!step || (!session && stepInt !== 1)) {
      router.push(`${pathname}?step=1`);
      return;
    }

    // If we have a user session, skip step 1
    if (session && stepInt === 1) {
      router.push(`${pathname}?step=2`);
      return;
    }
  }, [expired, router, pathname, session, step, stepInt]);

  const cardClasses = cn(userFormClasses, 'flex-row bg-transparent p-0 gap-6');
  const mainClasses = cn('bg-white flex w-full p-8 rounded-xl');

  const stepIndex = (stepInt - 1) as keyof typeof steps;

  const { component: StepComponent } = steps[stepIndex] as Step;

  return (
    <div className={cardClasses}>
      <OnboardSteps currentStep={stepIndex} />
      <div className={mainClasses}>
        <StepComponent />
      </div>
    </div>
  );
}

export default OnboardWizard;
