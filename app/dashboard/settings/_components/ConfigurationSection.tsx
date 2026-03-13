import SettingsCard from '~/components/settings/SettingsCard';
import SettingsField from '~/components/settings/SettingsField';
import Link from '~/components/ui/Link';
import { env } from '~/env';
import { getAppSetting, getInstallationId } from '~/queries/appSettings';
import UpdateUploadThingTokenAlert from '../../_components/UpdateUploadThingTokenAlert';
import UpdateInstallationId from './UpdateInstallationId';
import UpdateUploadThingToken from './UpdateUploadThingToken';

export default async function ConfigurationSection() {
  const [installationId, uploadThingKey] = await Promise.all([
    getInstallationId(),
    getAppSetting('uploadThingToken'),
  ]);

  return (
    <SettingsCard id="configuration" title="Configuration" divideChildren>
      <SettingsField
        label="Installation ID"
        description="This is the unique identifier for your installation of Fresco. This ID is used to track analytics data and for other internal purposes."
      >
        <UpdateInstallationId
          installationId={installationId ?? undefined}
          readOnly={!!env.INSTALLATION_ID}
        />
      </SettingsField>
      <SettingsField
        label="UploadThing API Key"
        description={
          <>
            This is the API key used to communicate with the UploadThing
            service. See our{' '}
            <Link href="https://documentation.networkcanvas.com/en/fresco/deployment/guide#create-a-storage-bucket-using-uploadthing">
              deployment documentation
            </Link>{' '}
            for information about how to obtain this key.
          </>
        }
      >
        <UpdateUploadThingTokenAlert />
        <UpdateUploadThingToken uploadThingKey={uploadThingKey} />
      </SettingsField>
    </SettingsCard>
  );
}
