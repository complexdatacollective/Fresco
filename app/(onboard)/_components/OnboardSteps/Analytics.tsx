'use client';
import { Button } from '~/components/ui/Button';
import { useOnboardingContext } from '../OnboardingProvider';
import AnalyticsSwitch from '~/components/AnalyticsSwitch/Switch';
import { api } from '~/trpc/client';

function Analytics() {
  // eslint-disable-next-line no-process-env
  const globalAnalyticsEnabled = process.env.NEXT_PUBLIC_ANALYTICS_ENABLED;
  const { currentStep, setCurrentStep } = useOnboardingContext();

  const handleNextStep = () => {
    setCurrentStep(currentStep + 1).catch(() => {});
  };

  const appSettings = api.appSettings.get.useQuery(undefined, {
    onError(error) {
      throw new Error(error.message);
    },
  });

  return (
    <div className="max-w-[30rem]">
      <div className="mb-4 flex flex-col">
        <h1 className="text-3xl font-bold">Analytics</h1>
        {globalAnalyticsEnabled === 'false' ? (
          <p className="mb-4 mt-4">
            Analytics are disabled globally. Please contact your administrator
            to enable analytics.
          </p>
        ) : (
          <p className="mb-4 mt-4">
            By default, the app is configured to allow collection of analytics.
            Analytics collection can be disabled here or in the app settings on
            the dashboard.
          </p>
        )}
      </div>
      <div>
        <AnalyticsSwitch allowAnalytics={!!appSettings?.data?.allowAnalytics} />
        <div className="flex justify-start">
          <Button onClick={handleNextStep}>Next</Button>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
