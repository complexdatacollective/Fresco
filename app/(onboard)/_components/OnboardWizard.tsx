'use client';

import { useState } from 'react';
import OnboardSteps from '~/app/(onboard)/_components/OnboardSteps/OnboardSteps';
import CreateAccount from '~/app/(onboard)/_components/OnboardSteps/CreateAccount';
import ConfigureStudy from '~/app/(onboard)/_components/OnboardSteps/ConfigureStudy';
import Documentation from '~/app/(onboard)/_components/OnboardSteps/Documentation';

function OnboardWizard() {
  const [step, setStep] = useState(1);

  const handleNextStep = () => {
    setStep(step + 1);
  };

  return (
    <div className="flex rounded-xl bg-white/80 p-6 shadow-lg backdrop-blur-md">
      <OnboardSteps currentStep={step} />
      <div className="flex flex-col pl-12 pr-12">
        {step === 1 && <CreateAccount handleNextStep={handleNextStep} />}
        {step === 2 && <ConfigureStudy handleNextStep={handleNextStep} />}
        {step === 3 && <Documentation />}
      </div>
    </div>
  );
}

export default OnboardWizard;
