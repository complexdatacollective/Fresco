import { AlertTriangleIcon } from 'lucide-react';
import Link from '~/components/Link';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/Alert';
import { getAppSetting } from '~/queries/appSettings';

export default async function UpdateUploadThingTokenAlert() {
  const uploadThingToken = await getAppSetting('uploadThingToken');

  if (uploadThingToken) return null;

  return (
    <Alert variant="destructive" className="mt-4">
      <AlertTriangleIcon className="h-4 w-4" />
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
