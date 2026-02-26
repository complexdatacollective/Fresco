'use client';

import { Check } from 'lucide-react';
import { parseAsInteger, useQueryState } from 'nuqs';
import Surface from '~/components/layout/Surface';
import Heading from '~/components/typography/Heading';
import { cx } from '~/utils/cva';

function OnboardSteps({ steps }: { steps: string[] }) {
  const [currentStep, setCurrentStep] = useQueryState(
    'step',
    parseAsInteger.withDefault(1),
  );

  return (
    <Surface noContainer className="flex flex-col gap-4">
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
              'border-primary/6 laptop:size-10 flex size-8 items-center justify-center rounded-full border text-sm font-bold',
              index < currentStep - 1 && 'bg-success border-success text-white',
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
            <Heading level="h4" variant="all-caps" className="m-0 text-xs">
              {step}
            </Heading>
          </div>
        </div>
      ))}
    </Surface>
  );
}

export default OnboardSteps;
