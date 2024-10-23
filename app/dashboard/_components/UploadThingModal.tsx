'use client';

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
import Paragraph from '~/components/ui/typography/Paragraph';

function UploadThingModal() {
  return (
    <Dialog open={true}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Required Environment Variable Update</DialogTitle>
          <DialogDescription>
            <Paragraph>
              This Fresco update requires a new UploadThing environment
              variable. Please add it by following these steps.
            </Paragraph>

            <Paragraph>
              <ol className="list-inside list-decimal">
                <li>
                  Visit the{' '}
                  <Link
                    href="https://uploadthing.com/dashboard/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    UploadThing dashboard
                  </Link>
                </li>
                <li>Select your project.</li>
                <li>Select the API Keys tab.</li>
                <li>Copy the token by clicking the Copy button.</li>
                <li>
                  Paste the token into the field below and submit the form.
                </li>
              </ol>
            </Paragraph>

            <Paragraph>
              For more detailed instructions, refer to the{' '}
              <Link
                href="https://documentation.networkcanvas.com/en/fresco/deployment/upgrading"
                target="_blank"
                rel="noopener noreferrer"
              >
                upgrading documentation.
              </Link>
            </Paragraph>
          </DialogDescription>
        </DialogHeader>

        <UploadThingTokenForm
          action={(token) => setAppSetting('uploadThingToken', token)}
        />
      </DialogContent>
    </Dialog>
  );
}

export default UploadThingModal;
