'use client';

import { useState, useEffect } from 'react';
import { steps } from '~/app/(onboard)/_components/OnboardSteps/Steps';
import { cn } from '~/utils/shadcn';
import { useRouter, useSearchParams } from 'next/navigation';
import OnboardSteps from './OnboardSteps/StepsSidebar';
import { userFormClasses } from '../_shared';

function OnboardWizard() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState(searchParams.get('step') ?? '1');
  const router = useRouter();

  useEffect(() => {
    const queryStep = searchParams.get('step');
    if (queryStep === null) {
      router.replace('/?step=1');
      return;
    }
    setStep(queryStep);
  }, [searchParams, router]);

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
