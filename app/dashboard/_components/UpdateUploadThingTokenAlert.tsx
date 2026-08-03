import { Alert, AlertDescription, AlertTitle } from '@codaco/fresco-ui/Alert';
import Link from '~/components/Link';
import { env } from '~/env';
import { getAppSetting } from '~/queries/appSettings';
import { getStorageProvider } from '~/queries/storageProvider';

export default async function UpdateUploadThingTokenAlert() {
  const storageProvider = await getStorageProvider();
  if (storageProvider === 's3') return null;

  const uploadThingToken =
    env.UPLOADTHING_TOKEN ?? (await getAppSetting('uploadThingToken'));
  if (uploadThingToken) return null;

  return (
    <Alert variant="destructive">
      <AlertTitle>Configuration update required</AlertTitle>
      <AlertDescription>
        You need to add a new UploadThing API key before you can upload
        protocols. See the{' '}
        <Link
          href="https://documentation.networkcanvas.com/en/fresco/deployment/upgrading#uploadthing-variable-update"
          target="_blank"
        >
          upgrade documentation
        </Link>{' '}
        for more information.
      </AlertDescription>
    </Alert>
  );
}
