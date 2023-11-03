'use client';
import { Button } from '~/components/ui/Button';
import { useOnboardingContext } from '../OnboardingProvider';
import AnalyticsSwitch from '~/components/AnalyticsSwitch/Switch';

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
          Analytics collection can be disabled here or in the app settings on
          the dashboard.
        </p>
      </div>
      <div>
        <AnalyticsSwitch allowAnalytics={true} />
        <div className="flex justify-start">
          <Button onClick={handleNextStep}>Next</Button>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
