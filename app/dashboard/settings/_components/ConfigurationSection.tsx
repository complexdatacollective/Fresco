import { Suspense } from 'react';
import SettingsCard from '~/components/settings/SettingsCard';
import SettingsField from '~/components/settings/SettingsField';
import VersionSection, {
  VersionSectionSkeleton,
} from '~/components/VersionSection';
import { env } from '~/env';
import { getInstallationId } from '~/queries/appSettings';
import UpdateInstallationId from './UpdateInstallationId';

export default async function ConfigurationSection() {
  const installationId = await getInstallationId();

  return (
    <SettingsCard id="configuration" title="Configuration" divideChildren>
      <Suspense fallback={<VersionSectionSkeleton />}>
        <VersionSection />
      </Suspense>
      <SettingsField
        label="Installation ID"
        description="This is the unique identifier for your installation of Fresco. This ID is used to track analytics data and for other internal purposes."
      >
        <UpdateInstallationId
          installationId={installationId ?? undefined}
          readOnly={!!env.INSTALLATION_ID}
        />
      </SettingsField>
    </SettingsCard>
  );
}
