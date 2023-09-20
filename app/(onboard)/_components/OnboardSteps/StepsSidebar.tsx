'use client';

import { Check } from 'lucide-react';
import { steps } from '~/app/(onboard)/_components/OnboardSteps/Steps';
import { cn } from '~/utils/shadcn';

const StepNumber = ({
  number,
  description,
  active = false,
  complete = false,
}: {
  number: number;
  description: string;
  active?: boolean;
  complete?: boolean;
}) => {
  const outerClasses = cn(
    'flex items-center gap-2 py-2 px-6 rounded-xl',
    active && 'bg-white',
  );

  return (
    <div key={number} className={outerClasses}>
      <div
        className={cn(
          'text-md flex h-10 w-10 items-center justify-center rounded-full border border-primary font-bold',
          complete && 'bg-primary text-white',
        )}
      >
        {complete ? <Check strokeWidth={3} size={18} /> : number + 1}
      </div>
      <div className="flex flex-col">
        <p className="text-md">{description}</p>
      </div>
    </div>
  );
};

function OnboardSteps({ currentStep }: { currentStep: keyof typeof steps }) {
  return (
    <div className="flex flex-shrink-0 flex-grow-0 flex-col gap-6">
      {steps.map((stepItem, index) => (
        <StepNumber
          key={index}
          number={index}
          description={stepItem.description}
          active={index === currentStep}
          complete={index < currentStep}
        />
      ))}
    </div>
  );
}

export default OnboardSteps;
