'use client';

import { useState, useEffect } from 'react';
import OnboardSteps from '~/app/(onboard)/_components/OnboardSteps/OnboardSteps';
import CreateAccount from '~/app/(onboard)/_components/OnboardSteps/CreateAccount';
import ConfigureStudy from '~/app/(onboard)/_components/OnboardSteps/ConfigureStudy';
import Documentation from '~/app/(onboard)/_components/OnboardSteps/Documentation';
import { cn } from '~/utils/shadcn';
import { useRouter, useSearchParams } from 'next/navigation';

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
      <OnboardSteps currentStep={step} />
      <div className={userFormClasses}>
        {step === '1' && <CreateAccount />}
        {step === '2' && <ConfigureStudy />}
        {step === '3' && <Documentation />}
      </div>
    </div>
  );
}

export default OnboardWizard;
