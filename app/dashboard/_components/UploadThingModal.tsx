'use client';

import Image from 'next/image';
import { useState } from 'react';
import { UploadThingTokenForm } from '~/app/(blobs)/(setup)/_components/UploadThingTokenForm';
import Paragraph from '~/components/typography/Paragraph';
import Link from '~/components/ui/Link';
import Dialog from '~/lib/dialogs/Dialog';

function UploadThingModal() {
  const [open, setOpen] = useState(true);
  return (
    <Dialog
      open={open}
      closeDialog={() => setOpen(false)}
      title="Required Environment Variable Update"
      description="The Fresco update you installed requires a new UploadThing API
              key. Until you add it, you will not be able to upload new protocols. Existing protocols will continue to function."
    >
      <Paragraph>
        Updating the key should take a matter of minutes, and can be completed
        using the following steps:
      </Paragraph>
      <ol className="mt-6 ml-4 list-inside list-decimal">
        <li>
          Visit the{' '}
          <Link href="https://uploadthing.com/dashboard/" target="_blank">
            UploadThing dashboard
          </Link>
        </li>
        <li>Select your project.</li>
        <li>Select the API Keys tab.</li>
        <li>
          Ensure you have the <strong>SDK v7+</strong> tab selected.
        </li>
        <li>
          Copy the token by clicking the Copy button (see screenshot below).{' '}
          <Image
            src="/images/uploadthing-key.png"
            width={500}
            height={300}
            alt="UploadThing API key dashboard"
            className="w-full"
          />
        </li>
        <li>
          Paste the token into the field below and click &quot;save and
          continue&quot;.
        </li>
      </ol>
      <UploadThingTokenForm />
    </Dialog>
  );
}

export default UploadThingModal;
