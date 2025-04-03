'use client';

import { parseAsInteger, useQueryState } from 'nuqs';
import { Button } from '~/components/ui/Button';

export default function OnboardContinue() {
  const [currentStep, setCurrentStep] = useQueryState(
    'step',
    parseAsInteger.withDefault(1),
  );

  return (
    <Button
      onClick={() => setCurrentStep(currentStep + 1)}
      data-testid="onboard-continue-button"
    >
      Continue
    </Button>
  );
}
