import { parseAsInteger, useQueryState } from 'nuqs';
import SettingsSection from '~/components/layout/SettingsSection';
import { Button } from '~/components/ui/Button';
import Heading from '~/components/ui/typography/Heading';
import Paragraph from '~/components/ui/typography/Paragraph';
import DisableAnalyticsSwitch from '../DisableAnalyticsSwitch';

function Analytics({ disableAnalytics }: { disableAnalytics: boolean }) {
  const [currentStep, setCurrentStep] = useQueryState(
    'step',
    parseAsInteger.withDefault(1),
  );

  const handleNextStep = () => {
    void setCurrentStep(currentStep + 1);
  };
  return (
    <div className="w-[30rem]">
      <div className="mb-6">
        <Heading variant="h2">Configure Analytics</Heading>
        <Paragraph>
          We use anonymous analytics to gather error data from instances of
          Fresco to troubleshoot issues. No identifiable information of any kind
          is collected or sent to us. We use this data to identify bugs and
          improve the app.
        </Paragraph>
        <Paragraph>
          If you would like to disable all analytics, toggle the switch below.
        </Paragraph>
      </div>
      <div className="mb-6 flex flex-col gap-2">
        <SettingsSection
          heading="Disable Analytics"
          controlArea={
            <DisableAnalyticsSwitch disableAnalytics={disableAnalytics} />
          }
        >
          <Paragraph>
            Disable all anonymous analytics data collection for this deployment.
          </Paragraph>
        </SettingsSection>
      </div>
      <Button onClick={handleNextStep}>Proceed</Button>
    </div>
  );
}

export default Analytics;
