'use client';

import { Check } from 'lucide-react';
import { parseAsInteger, useQueryState } from 'nuqs';
import Heading from '~/components/ui/typography/Heading';
import { cx } from '~/utils/cva';

function OnboardSteps({ steps }: { steps: string[] }) {
  const [currentStep, setCurrentStep] = useQueryState(
    'step',
    parseAsInteger.withDefault(1),
  );

  return (
    <div className="flex shrink-0 grow-0 flex-col gap-6 rounded-xl bg-white px-8 py-12">
      {steps.map((step, index) => (
        <div
          key={index}
          className={cx(
            'pointer-events-none flex items-center gap-2 rounded-xl',
            // Make 'clickable' if the step is complete
            currentStep > index && 'pointer-events-auto cursor-pointer',
          )}
          onClick={() => void setCurrentStep(index + 1)}
        >
          <div
            className={cx(
              'border-primary/[.06] flex h-10 w-10 items-center justify-center rounded-full border text-sm font-bold',
              index < currentStep - 1 &&
                'bg-success border-teal-400 text-white',
              index === currentStep - 1 &&
                'border-primary bg-primary text-white',
            )}
          >
            {index < currentStep - 1 ? (
              <Check strokeWidth={3} size={18} />
            ) : (
              index + 1
            )}
          </div>
          <div className="flex flex-col">
            <Heading variant={'h4-all-caps'} className="m-0 text-xs">
              {step}
            </Heading>
          </div>
        </div>
      ))}
    </div>
  );
}

export default OnboardSteps;
