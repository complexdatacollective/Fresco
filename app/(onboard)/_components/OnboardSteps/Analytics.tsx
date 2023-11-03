'use client';
import { Button } from '~/components/ui/Button';
import { useOnboardingContext } from '../OnboardingProvider';

function Analytics() {
  const { currentStep, setCurrentStep } = useOnboardingContext();

  const handleNextStep = () => {
    setCurrentStep(currentStep + 1).catch(() => {});
  };

  return (
    <div className="max-w-[30rem]">
      <div className="mb-4 flex flex-col">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="mb-4 mt-4">
          By default, the app is configured to allow collection of analytics.
          This includes number of protocols uploaded, number of interviews
          conducted, and number of interviews completed. No personally
          identifiable information, interview data, or protocol data is
          collected. Analytics collection can be disabled from the dashboard.
        </p>
      </div>
      <div>
        <div className="flex justify-start">
          <Button onClick={handleNextStep}>Next</Button>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
