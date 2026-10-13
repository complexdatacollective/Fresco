'use client';

import Image from 'next/image';
import { type ReactNode, useState } from 'react';

import { defineMessages } from '@codaco/app-i18n/messages';
import { useAppIntl } from '@codaco/app-i18n/react';
import FormStoreProvider from '@codaco/fresco-ui/form/store/formStoreProvider';
import Paragraph from '@codaco/fresco-ui/typography/Paragraph';
import { UploadThingTokenFormWithoutProvider } from '~/app/(blobs)/(setup)/_components/UploadThingTokenForm';
import FormDialog from '~/components/FormDialog';
import Link from '~/components/Link';

const messages = defineMessages({
  requiredEnvironmentVariableUpdate: {
    id: 'fresco.UploadThingModal.requiredEnvironmentVariableUpdate',
    defaultMessage: 'Required Environment Variable Update',
    description:
      'Researcher-facing UploadThingModal: Required Environment Variable Update',
  },
  theFrescoUpdateYouInstalledRequiresA: {
    id: 'fresco.UploadThingModal.theFrescoUpdateYouInstalledRequiresA',
    defaultMessage:
      'The Fresco update you installed requires a new UploadThing API key. Until you add it, you will not be able to upload new protocols. Existing protocols will continue to function.',
    description:
      'Researcher-facing UploadThingModal: The Fresco update you installed requires a new UploadThing API key. Until you add it, you will not be able',
  },
  updatingTheKeyShouldTakeAMatter: {
    id: 'fresco.UploadThingModal.updatingTheKeyShouldTakeAMatter',
    defaultMessage:
      'Updating the key should take a matter of minutes, and can be completed using the following steps:',
    description:
      'Researcher-facing UploadThingModal: Updating the key should take a matter of minutes, and can be completed using the following steps:',
  },
  visitTheUploadThingDashboard: {
    id: 'fresco.UploadThingModal.visitTheUploadThingDashboard',
    defaultMessage: 'Visit the <tag1> UploadThing dashboard </tag1>',
    description:
      'Researcher-facing UploadThingModal: Visit the  UploadThing dashboard ',
  },
  selectYourProject: {
    id: 'fresco.UploadThingModal.selectYourProject',
    defaultMessage: 'Select your project.',
    description: 'Researcher-facing UploadThingModal: Select your project.',
  },
  selectTheAPIKeysTab: {
    id: 'fresco.UploadThingModal.selectTheAPIKeysTab',
    defaultMessage: 'Select the API Keys tab.',
    description: 'Researcher-facing UploadThingModal: Select the API Keys tab.',
  },
  ensureYouHaveTheSDKV7Tab: {
    id: 'fresco.UploadThingModal.ensureYouHaveTheSDKV7Tab',
    defaultMessage: 'Ensure you have the <tag1>SDK v7+</tag1> tab selected.',
    description:
      'Researcher-facing UploadThingModal: Ensure you have the SDK v7+ tab selected.',
  },
  copyTheTokenByClickingTheCopy: {
    id: 'fresco.UploadThingModal.copyTheTokenByClickingTheCopy',
    defaultMessage:
      'Copy the token by clicking the Copy button (see screenshot below).',
    description:
      'Researcher-facing UploadThingModal: Copy the token by clicking the Copy button (see screenshot below).',
  },
  uploadThingAPIKeyDashboard: {
    id: 'fresco.UploadThingModal.uploadThingAPIKeyDashboard',
    defaultMessage: 'UploadThing API key dashboard',
    description:
      'Researcher-facing UploadThingModal: UploadThing API key dashboard',
  },
  pasteTheTokenIntoTheFieldBelow: {
    id: 'fresco.UploadThingModal.pasteTheTokenIntoTheFieldBelow',
    defaultMessage:
      'Paste the token into the field below and click "save and continue".',
    description:
      'Researcher-facing UploadThingModal: Paste the token into the field below and click "save and continue".',
  },
});

const renderDashboardLinkChunks = (chunks: ReactNode[]) => (
  <Link href="https://uploadthing.com/dashboard/" target="_blank">
    {chunks}
  </Link>
);

const renderStrongChunks = (chunks: ReactNode[]) => <strong>{chunks}</strong>;

function UploadThingModal() {
  const intl = useAppIntl();

  const [open, setOpen] = useState(true);
  // The store sits above the dialog so the dialog can read the form's
  // submission and stay open while the token is saved.
  return (
    <FormStoreProvider>
      <FormDialog
        open={open}
        closeDialog={() => setOpen(false)}
        title={intl.formatMessage(messages.requiredEnvironmentVariableUpdate)}
        description={intl.formatMessage(
          messages.theFrescoUpdateYouInstalledRequiresA,
        )}
      >
        <Paragraph>
          {intl.formatMessage(messages.updatingTheKeyShouldTakeAMatter)}
        </Paragraph>
        <ol className="mt-6 ml-4 list-inside list-decimal">
          <li>
            {intl.formatMessage(messages.visitTheUploadThingDashboard, {
              tag1: renderDashboardLinkChunks,
            })}
          </li>
          <li>{intl.formatMessage(messages.selectYourProject)}</li>
          <li>{intl.formatMessage(messages.selectTheAPIKeysTab)}</li>
          <li>
            {intl.formatMessage(messages.ensureYouHaveTheSDKV7Tab, {
              tag1: renderStrongChunks,
            })}
          </li>
          <li>
            {intl.formatMessage(messages.copyTheTokenByClickingTheCopy)}
            <Image
              src="/images/uploadthing-key.png"
              width={500}
              height={300}
              alt={intl.formatMessage(messages.uploadThingAPIKeyDashboard)}
              className="w-full"
            />
          </li>
          <li>{intl.formatMessage(messages.pasteTheTokenIntoTheFieldBelow)}</li>
        </ol>
        <UploadThingTokenFormWithoutProvider />
      </FormDialog>
    </FormStoreProvider>
  );
}

export default UploadThingModal;
