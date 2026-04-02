import { Alert, AlertDescription } from '~/components/ui/Alert';
import SettingsCard from '~/components/settings/SettingsCard';
import SettingsField from '~/components/settings/SettingsField';
import Link from '~/components/ui/Link';
import { getAppSetting } from '~/queries/appSettings';
import { hasProtocols } from '~/queries/storageProvider';
import UpdateUploadThingToken from './UpdateUploadThingToken';
import UpdateS3Settings from './UpdateS3Settings';

export default async function StorageProviderSection() {
  const [
    storageProvider,
    uploadThingKey,
    ,
    s3Endpoint,
    s3Bucket,
    s3Region,
    s3AccessKeyId,
    s3SecretAccessKey,
  ] = await Promise.all([
    getAppSetting('storageProvider'),
    getAppSetting('uploadThingToken'),
    hasProtocols(),
    getAppSetting('s3Endpoint'),
    getAppSetting('s3Bucket'),
    getAppSetting('s3Region'),
    getAppSetting('s3AccessKeyId'),
    getAppSetting('s3SecretAccessKey'),
  ]);

  const provider = storageProvider ?? 'uploadthing';
  const providerLabel =
    provider === 's3' ? 'S3 / S3-Compatible' : 'UploadThing';

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
          <UpdateUploadThingToken uploadThingKey={uploadThingKey} />
        </SettingsField>
      )}

      {provider === 's3' && (
        <UpdateS3Settings
          initialValues={{
            s3Endpoint: s3Endpoint ?? undefined,
            s3Bucket: s3Bucket ?? undefined,
            s3Region: s3Region ?? undefined,
            s3AccessKeyId: s3AccessKeyId ?? undefined,
            s3SecretAccessKey: s3SecretAccessKey ?? undefined,
          }}
        />
      )}
    </SettingsCard>
  );
}
