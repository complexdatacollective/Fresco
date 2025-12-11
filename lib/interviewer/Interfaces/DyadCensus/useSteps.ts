import { useState } from 'react';

type Steps = number[];

export default function useSteps(steps: Steps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [currentSubStep, setCurrentSubStep] = useState(0);

  // Total = number of steps * number of substeps
  const totalSteps = steps.reduce((acc, val) => acc + val, 0);

  const next = () => {
    if (currentSubStep < steps[currentStep]! - 1) {
      setCurrentSubStep((prev) => prev + 1);
    } else if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
      setCurrentSubStep(0);
    }
  };

  const back = () => {
    if (currentSubStep > 0) {
      setCurrentSubStep((prev) => prev - 1);
    } else if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      setCurrentSubStep(steps[currentStep - 1]! - 1);
    }
  };

  const isStepEnd = currentSubStep === steps[currentStep]! - 1;
  const isEnd = currentStep === steps.length - 1 && isStepEnd;
  const isStepStart = currentSubStep === 0;
  const isStart = currentStep === 0 && isStepStart;

  const value = [
    {
      totalSteps,
      step: currentStep,
      substep: currentSubStep,
      isStepEnd, // we are on the last substep of the current step
      isEnd, // we are on the last step and the last substep
      isStepStart, // we are on the first substep of the current step
      isStart, // we are on the first step and the first substep
    },
    next, // move to the next step or substep
    back, // move to the previous step or substep
  ];

  return value;
}
