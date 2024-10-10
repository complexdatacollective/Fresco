import { parseAsInteger, useQueryState } from 'nuqs';
import SettingsSection from '~/components/layout/SettingsSection';
import { Button } from '~/components/ui/Button';
import Heading from '~/components/ui/typography/Heading';
import Paragraph from '~/components/ui/typography/Paragraph';
import DisableAnalyticsSwitch from '../DisableAnalyticsSwitch';
import SandboxModeSwitch from '../SandboxModeSwitch';

function DeploymentSettings({
  sandboxMode,
  disableAnalytics,
}: {
  sandboxMode: boolean;
  disableAnalytics: boolean;
}) {
  const [currentStep, setCurrentStep] = useQueryState(
    'step',
    parseAsInteger.withDefault(1),
  );

  const handleNextStep = () => {
    void setCurrentStep(currentStep + 1);
  };
  return (
    <div className="w-[30rem]">
      <div className="mb-4">
        <Heading variant="h2">Configure Project</Heading>
        <Paragraph>Configure your deployment settings</Paragraph>
        <div className="flex flex-col gap-2">
          <SettingsSection
            heading="Sandbox Mode"
            controlArea={<SandboxModeSwitch sandboxMode={sandboxMode} />}
          >
            <Paragraph>
              If true, the app will use the sandbox mode, which disables
              resetting the database and other features
            </Paragraph>
          </SettingsSection>
          <SettingsSection
            heading="Disable Analytics"
            controlArea={
              <DisableAnalyticsSwitch disableAnalytics={disableAnalytics} />
            }
          >
            <Paragraph>
              If true, the app will not send anonymous analytics data to the
              server
            </Paragraph>
          </SettingsSection>
        </div>
      </div>
      <Button onClick={handleNextStep}>Proceed</Button>
    </div>
  );
}

export default DeploymentSettings;
