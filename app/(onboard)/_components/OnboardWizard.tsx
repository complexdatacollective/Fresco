'use client';

import { useState } from 'react';
import { steps } from '~/app/(onboard)/_components/OnboardSteps/Steps';
import { cn } from '~/utils/shadcn';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { router } from 'next/client';
import OnboardSteps from './OnboardSteps/StepsSidebar';
import { userFormClasses } from '../_shared';
import { useSession } from '~/contexts/SessionPrivider';
import { useEffect } from 'react';

function OnboardWizard() {
  const { session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStep = searchParams.get('step');
  const [step, setStep] = useState<string>(initialStep || '1');

  useEffect(() => {
    // If there's no search params, set the step to 1
    if (!initialStep) {
      router.push(pathname + '?step=' + step);
      return;
    }

    // If we have a user session, skip step 1
    if (session && step === '1') {
      setStep('2');
      router.push(pathname + '?step=2');
      return;
    }
  }, [session, pathname, step, router, initialStep]);

  const cardClasses = cn(userFormClasses, 'flex-row bg-transparent p-0 gap-6');

  const mainClasses = cn('bg-white flex w-full p-8 rounded-xl');

  return (
    <div className={cardClasses}>
      <OnboardSteps currentStep={step} />
      <div className={mainClasses}>
        {steps
          .filter((stepItem) => stepItem.number === step)
          .map((stepItem) => (
            <stepItem.component key={stepItem.number} />
          ))}
      </div>
    </div>
  );
}

export default OnboardWizard;
