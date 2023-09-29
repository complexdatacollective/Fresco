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

function OnboardWizard() {
  const { session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const step = searchParams.get('step');

  useEffect(() => {
    // If there's no search params, set the step to 1
    if (!step) {
      router.push(pathname + '?step=1');
    }
  }, [session, pathname, step, router]);

  useEffect(() => {
    // If we have a user session, skip step 1
    if (session && step === '1') {
      router.push(pathname + '?step=2');
    }
  }, [session, pathname, step, router]);

  const cardClasses = cn(userFormClasses, 'flex-row bg-transparent p-0 gap-6');

  const mainClasses = cn('bg-white flex w-full p-8 rounded-xl');

  if (!step) return null;

  const stepIndex = (parseInt(step || '1') - 1) as keyof typeof steps;

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
