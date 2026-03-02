import { Suspense } from 'react';
import DisableAnalyticsSwitch from '~/components/DisableAnalyticsSwitch';
import SettingsCard from '~/components/settings/SettingsCard';
import SettingsField from '~/components/settings/SettingsField';
import { SwitchSkeleton } from '~/components/ui/switch';
import { env } from '~/env';
import ReadOnlyEnvAlert from '../ReadOnlyEnvAlert';

export default function PrivacySection() {
  return (
    <SettingsCard id="privacy" title="Privacy" divideChildren>
      <SettingsField
        label="Disable Analytics"
        testId="disable-analytics-field"
        description="If this option is enabled, no anonymous analytics data will be sent to the Network Canvas team."
        control={
          <Suspense fallback={<SwitchSkeleton />}>
            <DisableAnalyticsSwitch />
          </Suspense>
        }
      >
        {!!env.DISABLE_ANALYTICS && <ReadOnlyEnvAlert />}
      </SettingsField>
    </SettingsCard>
  );
}
