import Link from '~/components/Link';
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
          Follow the steps in the{' '}
          <Link
            href="https://documentation.networkcanvas.com/en/fresco/deployment/guide"
            target="_blank"
            rel="noopener noreferrer"
          >
            deployment guide
          </Link>{' '}
          to create an account and get your token. Then, paste the token below.
        </Paragraph>
        <UploadThingTokenForm />
      </div>
    </div>
  );
}

export default ConnectUploadThing;
