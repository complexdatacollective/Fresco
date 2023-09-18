'use client';

import { useState, useEffect } from 'react';
import { steps } from '~/app/(onboard)/_components/OnboardSteps/Steps';
import { cn } from '~/utils/shadcn';
import { useRouter, useSearchParams } from 'next/navigation';
import OnboardSteps from './OnboardSteps/StepsSidebar';

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

  const cardClasses = cn(
    'relative mt-[-60px] flex flex-row rounded-xl  bg-white p-8',
    'after:absolute after:inset-[-20px] after:z-[-1] after:rounded-3xl after:bg-white/30 after:shadow-2xl after:backdrop-blur-sm',
  );

  const userFormClasses = cn('relative flex w-[30rem] flex-row p-8');

  return (
    <div className={cardClasses}>
      {step === 'expired' ? (
        <div>
          <h1 className="text-3xl font-bold">Configuration Expired</h1>
          <p>Your configuration has expired.</p>
        </div>
      ) : (
        <>
          <OnboardSteps currentStep={step} />
          <div className={userFormClasses}>
            {steps
              .filter((stepItem) => stepItem.number === step)
              .map((stepItem) => (
                <stepItem.component key={stepItem.number} />
              ))}
          </div>
        </>
      )}
    </div>
  );
}

export default OnboardWizard;
