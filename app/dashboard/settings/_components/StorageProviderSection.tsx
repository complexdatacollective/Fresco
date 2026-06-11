import { Alert, AlertDescription } from '@codaco/fresco-ui/Alert';
import SettingsCard from '~/components/settings/SettingsCard';
import SettingsField from '~/components/settings/SettingsField';
import Link from '~/components/Link';
import { getStorageEnvStatus } from '~/lib/storage/config';
import { getAppSetting } from '~/queries/appSettings';
import { getStorageProvider } from '~/queries/storageProvider';
import UpdateUploadThingToken from './UpdateUploadThingToken';
import UpdateS3Settings from './UpdateS3Settings';

export default async function StorageProviderSection() {
  const [provider, s3Endpoint, s3PublicUrl, s3Bucket, s3Region] =
    await Promise.all([
      getStorageProvider(),
      getAppSetting('s3Endpoint'),
      getAppSetting('s3PublicUrl'),
      getAppSetting('s3Bucket'),
      getAppSetting('s3Region'),
    ]);

  const envStatus = getStorageEnvStatus();
  const providerLabel =
    provider === 's3' ? 'S3 / S3-Compatible' : 'UploadThing';

  const activeProviderEnvManaged =
    provider === 's3'
      ? envStatus.s3EnvManaged
      : envStatus.uploadThingEnvManaged;

  if (activeProviderEnvManaged) {
    return (
      <SettingsCard id="storage" title="Storage" divideChildren>
        <SettingsField
          label="Storage Provider"
          description={`Files are stored using ${providerLabel}.`}
        >
          <Alert variant="info">
            <AlertDescription>
              Storage is configured via environment variables (
              {envStatus.setVariables.join(', ')}) and cannot be edited here.
              Remove these variables to manage storage from this dashboard.
            </AlertDescription>
          </Alert>
        </SettingsField>
      </SettingsCard>
    );
  }

  return (
    <SettingsCard id="storage" title="Storage" divideChildren>
      <SettingsField
        label="Storage Provider"
        description={`Files are stored using ${providerLabel}.`}
      >
        <Alert variant="info">
          <AlertDescription>
            The storage provider type cannot be changed once the application has
            been deployed. You can update the credentials below.
          </AlertDescription>
        </Alert>
      </SettingsField>

      {provider === 'uploadthing' && (
        <SettingsField
          label="UploadThing API Key"
          description={
            <>
              The API key used to communicate with UploadThing. See the{' '}
              <Link href="https://documentation.networkcanvas.com/en/fresco/deployment/guide#create-a-storage-bucket-using-uploadthing">
                deployment documentation
              </Link>{' '}
              for details.
            </>
          }
        >
          <UpdateUploadThingToken />
        </SettingsField>
      )}

      {provider === 's3' && (
        <UpdateS3Settings
          initialValues={{
            s3Endpoint: s3Endpoint ?? undefined,
            s3PublicUrl: s3PublicUrl ?? undefined,
            s3Bucket: s3Bucket ?? undefined,
            s3Region: s3Region ?? undefined,
          }}
        />
      )}
    </SettingsCard>
  );
}
