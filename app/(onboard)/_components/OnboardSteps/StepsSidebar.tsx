'use client';

import { Check } from 'lucide-react';
import { steps } from '~/app/(onboard)/_components/OnboardSteps/Steps';

interface OnboardStepsProps {
  currentStep: string;
}

function OnboardSteps({ currentStep }: OnboardStepsProps) {
  return (
    <div className="flex flex-col space-y-4 rounded-xl border border-foreground p-4">
      {steps.map((stepItem) => (
        <div key={stepItem.number} className="flex items-center space-x-2">
          {currentStep > stepItem.number ? (
            <div className="h-8 w-8">
              <Check size={24} />
            </div>
          ) : (
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                currentStep === stepItem.number
                  ? 'bg-foreground text-white'
                  : 'border border-foreground bg-transparent'
              }`}
            >
              {stepItem.number}
            </div>
          )}
          <div className="flex flex-col">
            <p className="text-xs text-muted-foreground">
              Step {stepItem.number}
            </p>
            <p className="text-sm">{stepItem.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default OnboardSteps;
