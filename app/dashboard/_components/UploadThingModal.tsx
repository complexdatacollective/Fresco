'use client';

import Image from 'next/image';
import { useState } from 'react';
import { setAppSetting } from '~/actions/appSettings';
import { UploadThingTokenForm } from '~/app/(blobs)/(setup)/_components/UploadThingTokenForm';
import Link from '~/components/Link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Divider } from '~/components/ui/Divider';
import Paragraph from '~/components/ui/typography/Paragraph';

function UploadThingModal() {
  const [open, setOpen] = useState(true);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Required Environment Variable Update</DialogTitle>
          <DialogDescription>
            <Paragraph>
              The Fresco update you installed requires a new UploadThing API
              key.{' '}
              <strong>
                Until you add it, you will not be able to upload new protocols
              </strong>
              . Existing protocols will continue to function.
            </Paragraph>
            <Divider />
            <Paragraph>
              Updating the key should take a matter of minutes, and can be
              completed using the following steps:
            </Paragraph>
            <ol className="ml-4 mt-6 list-inside list-decimal">
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
                Copy the token by clicking the Copy button (see screenshot
                below).{' '}
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
          </DialogDescription>
        </DialogHeader>
        <Divider />
        <UploadThingTokenForm
          action={(token) => setAppSetting('uploadThingToken', token)}
        />
      </DialogContent>
    </Dialog>
  );
}

export default UploadThingModal;
