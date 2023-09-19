'use client';

import { Check } from 'lucide-react';
import { steps } from '~/app/(onboard)/_components/OnboardSteps/Steps';
import { cn } from '~/utils/shadcn';

interface OnboardStepsProps {
  currentStep: string;
}

const StepNumber = ({
  number,
  description,
  active = false,
  complete = false,
}: {
  number: string;
  description: string;
  active?: boolean;
  complete?: boolean;
}) => {
  if (complete) {
    return <Check size={15} />;
  }

  const outerClasses = cn(
    'flex items-center gap-2 py-2 px-6 rounded-xl',
    active && 'bg-white',
  );

  return (
    <div key={number} className={outerClasses}>
      <div
        className={cn(
          'text-md flex h-10 w-10 items-center justify-center rounded-full border border-primary font-bold',
        )}
      >
        {number}
      </div>
      <div className="flex flex-col">
        <p className="text-md">{description}</p>
      </div>
    </div>
  );
};

function OnboardSteps({ currentStep }: OnboardStepsProps) {
  return (
    <div className="flex flex-shrink-0 flex-grow-0 flex-col gap-6">
      {steps.map((stepItem) => (
        <StepNumber
          key={stepItem.number}
          number={stepItem.number}
          description={stepItem.description}
          active={stepItem.number === currentStep}
          complete={stepItem.number < currentStep}
        />
      ))}
    </div>
  );
}

export default OnboardSteps;
