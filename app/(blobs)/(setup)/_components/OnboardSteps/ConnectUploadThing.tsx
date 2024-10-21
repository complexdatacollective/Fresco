import Link from '~/components/Link';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/Alert';
import Heading from '~/components/ui/typography/Heading';
import Paragraph from '~/components/ui/typography/Paragraph';
import { UploadThingTokenForm } from '../UploadThingTokenForm';

function ConnectUploadThing() {
  return (
    <div className="w-[30rem]">
      <div className="mb-4">
        <Heading variant="h2">Connect UploadThing</Heading>
        <Paragraph>
          Fresco uses a third-party service called UploadThing to store media
          files, including protocol assets. In order to use this service, you
          need to create an account with UploadThing that will allow you to
          generate a token that Fresco can use to securely communicate with it.
        </Paragraph>
        <Paragraph>
          <Link
            href="https://uploadthing.com/dashboard/new"
            target="_blank"
            rel="noopener noreferrer"
          >
            Click here
          </Link>{' '}
          to visit UploadThing. Create an app and copy and paste your API key
          below.
        </Paragraph>
        <Alert variant="info" className="mt-4">
          <AlertTitle>Good to know:</AlertTitle>
          <AlertDescription>
            Your UploadThing account is unique to you, meaning that no one else
            will have access to the files stored in your instance of Fresco. For
            more information about UploadThing, please review the{' '}
            <Link href="https://docs.uploadthing.com/" target="_blank">
              UploadThing Docs
            </Link>
            .
          </AlertDescription>
        </Alert>
        <Paragraph>
          For help, please refer to the{' '}
          <Link
            href="https://documentation.networkcanvas.com/en/fresco/deployment/guide#create-a-storage-bucket-using-uploadthing"
            target="_blank"
            rel="noopener noreferrer"
          >
            deployment guide
          </Link>{' '}
          in the Fresco documentation.
        </Paragraph>
        <UploadThingTokenForm />
      </div>
    </div>
  );
}

export default ConnectUploadThing;
