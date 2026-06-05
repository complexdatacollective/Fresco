import Heading from '@codaco/fresco-ui/typography/Heading';
import Paragraph from '@codaco/fresco-ui/typography/Paragraph';
import StorageProviderSelector from '../StorageProviderSelector';

export default function ConfigureStorage() {
  return (
    <div className="w-full">
      <div className="mb-4">
        <Heading level="h2">Configure Storage</Heading>
        <Paragraph>
          Fresco needs a storage provider for protocol assets and data exports.
          Choose between UploadThing (managed service) or an S3-compatible
          bucket (self-hosted or cloud).
        </Paragraph>
        <StorageProviderSelector />
      </div>
    </div>
  );
}
