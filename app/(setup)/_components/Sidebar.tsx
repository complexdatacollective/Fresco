'use client';

import { Check } from 'lucide-react';
import { cn } from '~/utils/shadcn';
import { useOnboardingContext } from './OnboardingProvider';
import Paragraph from '~/components/ui/typography/Paragraph';

const stepLabels = [
  'Create Account',
  'Upload Protocol',
  'Configure Participation',
  'Documentation',
];

function OnboardSteps() {
  const { currentStep, setCurrentStep } = useOnboardingContext();

  return (
    <div className="bg-white flex flex-shrink-0 flex-grow-0 flex-col gap-6 rounded-xl px-8 py-12">
      {stepLabels.map((step, index) => (
        <div
          key={index}
          className={cn(
            'pointer-events-none flex items-center gap-2 rounded-xl',
            // Make 'clickable' if the step is complete
            currentStep > index && 'pointer-events-auto cursor-pointer',
          )}
          onClick={() => void setCurrentStep(index + 1)}
        >
          <div
            className={cn(
              'text-md flex h-10 w-10 items-center justify-center rounded-full border border-primary/[.06] font-bold',
              index < currentStep - 1 &&
                'border-teal-400 text-white bg-success',
              index === currentStep - 1 &&
                'text-white border-primary bg-primary',
            )}
          >
            {index < currentStep - 1 ? (
              <Check strokeWidth={3} size={18} />
            ) : (
              index + 1
            )}
          </div>
          <div className="flex flex-col">
            <Paragraph variant="noMargin">{step}</Paragraph>
          </div>
        </div>
      ))}
    </div>
  );
}

export default OnboardSteps;
