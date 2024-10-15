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
      <div className="mb-6">
        <Heading variant="h2">Deployment Settings</Heading>
        <Paragraph>
          These are optional deployment settings. These cannot be changed later.
          Refer to the deployment guide for more information.
        </Paragraph>
      </div>
      <div className="mb-6 flex flex-col gap-2">
        <SettingsSection
          heading="Sandbox Mode"
          controlArea={<SandboxModeSwitch sandboxMode={sandboxMode} />}
        >
          <Paragraph>
            If enabled, the app will use the sandbox mode, which disables
            resetting the database and other features.
          </Paragraph>
        </SettingsSection>
        <SettingsSection
          heading="Disable Analytics"
          controlArea={
            <DisableAnalyticsSwitch disableAnalytics={disableAnalytics} />
          }
        >
          <Paragraph>
            We use anonymous analytics to gather error data from instances of
            Fresco to troubleshoot issues. To disable analytics, toggle this on.
          </Paragraph>
        </SettingsSection>
      </div>
      <Button onClick={handleNextStep}>Proceed</Button>
    </div>
  );
}

export default DeploymentSettings;
