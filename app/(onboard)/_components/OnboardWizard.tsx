'use client';

import { useState, useEffect } from 'react';
import OnboardSteps from '~/app/(onboard)/_components/OnboardSteps/OnboardSteps';
import CreateAccount from '~/app/(onboard)/_components/OnboardSteps/CreateAccount';
import SignIn from '~/app/(onboard)/_components/OnboardSteps/SignIn';
import ConfigureStudy from '~/app/(onboard)/_components/OnboardSteps/ConfigureStudy';
import Documentation from '~/app/(onboard)/_components/OnboardSteps/Documentation';
import { cn } from '~/utils/shadcn';
import { checkSessionExists, checkUserExists } from '~/app/actions';

function OnboardWizard() {
  const [step, setStep] = useState(1);

  useEffect(() => {
    // If the user already exists, skip the first step. Prevents multiple users from being created.
    checkUserExists()
      .then((userExists) => {
        if (userExists) {
          setStep(2);
        }
      })
      .catch((error) => {
        console.error('Error checking user existence:', error);
      });
  }, []);

  useEffect(() => {
    // If the session already exists, continue to third step
    checkSessionExists()
      .then((sessionExists) => {
        if (sessionExists) {
          setStep(3);
        }
      })
      .catch((error) => {
        console.error('Error checking session existence:', error);
      });
  }, []);

  const handleNextStep = () => {
    setStep(step + 1);
  };

  const cardClasses = cn(
    'relative mt-[-60px] flex flex-row rounded-xl  bg-white p-8',
    'after:absolute after:inset-[-20px] after:z-[-1] after:rounded-3xl after:bg-white/30 after:shadow-2xl after:backdrop-blur-sm',
  );

  const userFormClasses = cn('relative flex w-[30rem] flex-row p-8');

  return (
    <div className={cardClasses}>
      <OnboardSteps currentStep={step} />
      <div className={userFormClasses}>
        {step === 1 && <CreateAccount handleNextStep={handleNextStep} />}
        {step === 2 && <SignIn handleNextStep={handleNextStep} />}
        {step === 3 && <ConfigureStudy handleNextStep={handleNextStep} />}
        {step === 4 && <Documentation />}
      </div>
    </div>
  );
}

export default OnboardWizard;
