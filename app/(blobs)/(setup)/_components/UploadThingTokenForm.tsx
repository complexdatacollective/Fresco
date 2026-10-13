'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { commonMessages } from '@codaco/app-i18n/common';
import { createMessageError, defineMessages } from '@codaco/app-i18n/messages';
import { AppErrorMessage, useAppIntl } from '@codaco/app-i18n/react';
import { Alert, AlertDescription } from '@codaco/fresco-ui/Alert';
import { Button } from '@codaco/fresco-ui/Button';
import Field from '@codaco/fresco-ui/form/Field/Field';
import InputField from '@codaco/fresco-ui/form/fields/InputField';
import { FormWithoutProvider } from '@codaco/fresco-ui/form/Form';
import FormStoreProvider from '@codaco/fresco-ui/form/store/formStoreProvider';
import SubmitButton from '@codaco/fresco-ui/form/SubmitButton';
import { setUploadThingToken } from '~/actions/appSettings';
import { setStorageProvider } from '~/actions/storageProvider';
import { captureClientException } from '~/lib/posthog-client';
import { createUploadThingSchemas } from '~/schemas/appSettings';

const messages = defineMessages({
  copyAnUnexpectedErrorOccurred: {
    id: 'fresco.UploadThingTokenForm.copyAnUnexpectedErrorOccurred',
    defaultMessage: 'An unexpected error occurred',
    description:
      'Researcher-facing UploadThingTokenForm: An unexpected error occurred',
  },
  copyFailedToSetStorageProvider: {
    id: 'fresco.UploadThingTokenForm.copyFailedToSetStorageProvider',
    defaultMessage: 'Failed to set storage provider.',
    description:
      'Researcher-facing UploadThingTokenForm: Failed to set storage provider.',
  },
  copySaving: {
    id: 'fresco.UploadThingTokenForm.copySaving',
    defaultMessage: 'Saving...',
    description: 'Researcher-facing UploadThingTokenForm: Saving...',
  },
  theUploadThingTokenIsConfiguredViaAn: {
    id: 'fresco.UploadThingTokenForm.theUploadThingTokenIsConfiguredViaAn',
    defaultMessage:
      'The UploadThing token is configured via an environment variable and cannot be changed here.',
    description:
      'Researcher-facing UploadThingTokenForm: The UploadThing token is configured via an environment variable and cannot be changed here.',
  },
  uPLOADTHINGTOKEN: {
    id: 'fresco.UploadThingTokenForm.uPLOADTHINGTOKEN',
    defaultMessage: 'UPLOADTHING_TOKEN',
    description: 'Researcher-facing UploadThingTokenForm: UPLOADTHING_TOKEN',
  },
  uPLOADTHINGTOKEN2: {
    id: 'fresco.UploadThingTokenForm.uPLOADTHINGTOKEN2',
    defaultMessage: 'UPLOADTHING_TOKEN=******************',
    description:
      'Researcher-facing UploadThingTokenForm: UPLOADTHING_TOKEN=******************',
  },
  copyAndPasteTheFullTokenFrom: {
    id: 'fresco.UploadThingTokenForm.copyAndPasteTheFullTokenFrom',
    defaultMessage:
      'Copy and paste the full token from your UploadThing dashboard.',
    description:
      'Researcher-facing UploadThingTokenForm: Copy and paste the full token from your UploadThing dashboard.',
  },
  pasteTheFullTokenIncludingTheUPLOADTHING: {
    id: 'fresco.UploadThingTokenForm.pasteTheFullTokenIncludingTheUPLOADTHING',
    defaultMessage:
      'Paste the full token including the UPLOADTHING_TOKEN= prefix',
    description:
      'Researcher-facing UploadThingTokenForm: Paste the full token including the UPLOADTHING_TOKEN= prefix',
  },
  saveAndContinue: {
    id: 'fresco.UploadThingTokenForm.saveAndContinue',
    defaultMessage: 'Save and continue',
    description: 'Researcher-facing UploadThingTokenForm: Save and continue',
  },
});

type UploadThingTokenFormProps = {
  disabled?: boolean;
};

export const UploadThingTokenForm = (props: UploadThingTokenFormProps) => (
  <FormStoreProvider>
    <UploadThingTokenFormWithoutProvider {...props} />
  </FormStoreProvider>
);

/**
 * The form without its store provider, for a host that needs to read the
 * store itself — a dialog that must stay open while the token is saved.
 */
export const UploadThingTokenFormWithoutProvider = ({
  disabled = false,
}: UploadThingTokenFormProps) => {
  const intl = useAppIntl();
  const { createUploadThingTokenSchema } =
    createUploadThingSchemas(createMessageError);

  const router = useRouter();
  const [isContinuing, setIsContinuing] = useState(false);
  const [continueError, setContinueError] = useState<string | null>(null);

  const handleContinue = async () => {
    setIsContinuing(true);
    setContinueError(null);
    try {
      const result = await setStorageProvider('uploadthing');
      if (!result.success) {
        setContinueError(result.error);
        return;
      }
      router.push('/setup?step=3');
    } catch (caught) {
      captureClientException(caught);
      setContinueError(
        createMessageError(messages.copyAnUnexpectedErrorOccurred),
      );
    } finally {
      setIsContinuing(false);
    }
  };

  const handleSubmit = async (rawData: unknown) => {
    if (disabled) {
      return { success: true as const };
    }

    try {
      const result = await setUploadThingToken(rawData);

      if (!result.success) {
        return {
          success: false as const,
          fieldErrors: result.fieldErrors,
        };
      }

      const providerResult = await setStorageProvider('uploadthing');
      if (!providerResult.success) {
        return {
          success: false as const,
          formErrors: [
            providerResult.error ??
              createMessageError(messages.copyFailedToSetStorageProvider),
          ],
        };
      }

      router.push('/setup?step=3');

      return {
        success: true as const,
      };
    } catch (error) {
      captureClientException(error);
      const message = createMessageError(
        messages.copyAnUnexpectedErrorOccurred,
      );
      return {
        success: false as const,
        formErrors: [message],
      };
    }
  };

  return (
    <FormWithoutProvider onSubmit={handleSubmit}>
      {disabled && (
        <Alert variant="info">
          <AlertDescription>
            {intl.formatMessage(messages.theUploadThingTokenIsConfiguredViaAn)}
          </AlertDescription>
        </Alert>
      )}
      <Field
        key="uploadThingToken"
        name="uploadThingToken"
        label={intl.formatMessage(messages.uPLOADTHINGTOKEN)}
        placeholder={intl.formatMessage(messages.uPLOADTHINGTOKEN2)}
        hint={intl.formatMessage(messages.copyAndPasteTheFullTokenFrom)}
        custom={{
          schema: createUploadThingTokenSchema,
          hint: intl.formatMessage(
            messages.pasteTheFullTokenIncludingTheUPLOADTHING,
          ),
        }}
        component={InputField}
        type="text"
        disabled={disabled}
        initialValue={disabled ? 'UPLOADTHING_TOKEN=••••••••' : undefined}
      />
      {disabled ? (
        <>
          {continueError && (
            <p className="text-destructive text-sm">
              <AppErrorMessage error={continueError} />
            </p>
          )}
          <Button
            onClick={handleContinue}
            color="primary"
            disabled={isContinuing}
            className="self-start"
          >
            {isContinuing
              ? intl.formatMessage(messages.copySaving)
              : intl.formatMessage(commonMessages.continue)}
          </Button>
        </>
      ) : (
        <SubmitButton key="submit" className="mt-6">
          {intl.formatMessage(messages.saveAndContinue)}
        </SubmitButton>
      )}
    </FormWithoutProvider>
  );
};
