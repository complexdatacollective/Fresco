import Heading from '@codaco/fresco-ui/typography/Heading';
import Paragraph from '@codaco/fresco-ui/typography/Paragraph';
import { type StorageEnvStatus } from '~/lib/storage/config';
import { type S3EnvValues } from '~/schemas/s3Settings';
import StorageProviderSelector from '../StorageProviderSelector';

export default function ConfigureStorage({
  storageEnv,
  s3EnvValues,
}: {
  storageEnv: StorageEnvStatus;
  s3EnvValues: S3EnvValues | null;
}) {
  return (
    <div className="w-full">
      <div className="mb-4">
        <Heading level="h2">Configure Storage</Heading>
        <Paragraph>
          Fresco needs a storage provider for protocol assets and data exports.
          Choose between UploadThing (managed service) or an S3-compatible
          bucket (self-hosted or cloud).
        </Paragraph>
        <StorageProviderSelector
          envStatus={storageEnv}
          s3EnvValues={s3EnvValues}
        />
      </div>
    </div>
  );
}
