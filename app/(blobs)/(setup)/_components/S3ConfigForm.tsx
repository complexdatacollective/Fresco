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
import Form from '@codaco/fresco-ui/form/Form';
import SubmitButton from '@codaco/fresco-ui/form/SubmitButton';
import { saveS3Config, setStorageProvider } from '~/actions/storageProvider';
import { captureClientException } from '~/lib/posthog-client';
import {
  createS3SettingsSchemas,
  type S3EnvValues,
} from '~/schemas/s3Settings';

const messages = defineMessages({
  copyAnUnexpectedErrorOccurred: {
    id: 'fresco.S3ConfigForm.copyAnUnexpectedErrorOccurred',
    defaultMessage: 'An unexpected error occurred',
    description: 'Researcher-facing S3ConfigForm: An unexpected error occurred',
  },
  copySaving: {
    id: 'fresco.S3ConfigForm.copySaving',
    defaultMessage: 'Saving...',
    description: 'Researcher-facing S3ConfigForm: Saving...',
  },
  theseS3SettingsAreConfiguredViaEnvironment: {
    id: 'fresco.S3ConfigForm.theseS3SettingsAreConfiguredViaEnvironment',
    defaultMessage:
      'These S3 settings are configured via environment variables and cannot be changed here.',
    description:
      'Researcher-facing S3ConfigForm: These S3 settings are configured via environment variables and cannot be changed here.',
  },
  endpointURL: {
    id: 'fresco.S3ConfigForm.endpointURL',
    defaultMessage: 'Endpoint URL',
    description: 'Researcher-facing S3ConfigForm: Endpoint URL',
  },
  theS3CompatibleEndpointURL: {
    id: 'fresco.S3ConfigForm.theS3CompatibleEndpointURL',
    defaultMessage: 'The S3-compatible endpoint URL',
    description:
      'Researcher-facing S3ConfigForm: The S3-compatible endpoint URL',
  },
  required: {
    id: 'fresco.S3ConfigForm.required',
    defaultMessage: 'Required',
    description: 'Researcher-facing S3ConfigForm: Required',
  },
  publicURL: {
    id: 'fresco.S3ConfigForm.publicURL',
    defaultMessage: 'Public URL',
    description: 'Researcher-facing S3ConfigForm: Public URL',
  },
  theURLBrowsersUseToReachThis: {
    id: 'fresco.S3ConfigForm.theURLBrowsersUseToReachThis',
    defaultMessage:
      "The URL browsers use to reach this storage. For the storage bundled with Fresco's Docker deployment, this is your Fresco domain. For AWS S3 or R2, this is usually the same as the Endpoint URL.",
    description:
      'Researcher-facing S3ConfigForm: hint under the Public URL field. The bundled storage is served through the reverse proxy on the Fresco domain, so its public URL is that domain; for AWS S3 or Cloudflare R2 it usually matches the Endpoint URL.',
  },
  bucketName: {
    id: 'fresco.S3ConfigForm.bucketName',
    defaultMessage: 'Bucket Name',
    description: 'Researcher-facing S3ConfigForm: Bucket Name',
  },
  myFrescoBucket: {
    id: 'fresco.S3ConfigForm.myFrescoBucket',
    defaultMessage: 'my-fresco-bucket',
    description: 'Researcher-facing S3ConfigForm: my-fresco-bucket',
  },
  region: {
    id: 'fresco.S3ConfigForm.region',
    defaultMessage: 'Region',
    description: 'Researcher-facing S3ConfigForm: Region',
  },
  usEast1: {
    id: 'fresco.S3ConfigForm.usEast1',
    defaultMessage: 'us-east-1',
    description: 'Researcher-facing S3ConfigForm: us-east-1',
  },
  accessKeyID: {
    id: 'fresco.S3ConfigForm.accessKeyID',
    defaultMessage: 'Access Key ID',
    description: 'Researcher-facing S3ConfigForm: Access Key ID',
  },
  aKIAIOSFODNN7EXAMPLE: {
    id: 'fresco.S3ConfigForm.aKIAIOSFODNN7EXAMPLE',
    defaultMessage: 'AKIAIOSFODNN7EXAMPLE',
    description: 'Researcher-facing S3ConfigForm: AKIAIOSFODNN7EXAMPLE',
  },
  secretAccessKey: {
    id: 'fresco.S3ConfigForm.secretAccessKey',
    defaultMessage: 'Secret Access Key',
    description: 'Researcher-facing S3ConfigForm: Secret Access Key',
  },
  wJalrXUtnFEMIK7MDENGBPxRfiCYEXAMPLEKEY: {
    id: 'fresco.S3ConfigForm.wJalrXUtnFEMIK7MDENGBPxRfiCYEXAMPLEKEY',
    defaultMessage: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    description:
      'Researcher-facing S3ConfigForm: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
  },
  saveAndContinue: {
    id: 'fresco.S3ConfigForm.saveAndContinue',
    defaultMessage: 'Save and continue',
    description: 'Researcher-facing S3ConfigForm: Save and continue',
  },
});

export const S3ConfigForm = ({
  disabled = false,
  defaultValues,
}: {
  disabled?: boolean;
  defaultValues?: S3EnvValues;
}) => {
  const intl = useAppIntl();
  const { s3ConfigSchema } = createS3SettingsSchemas(createMessageError);

  const router = useRouter();
  const [isContinuing, setIsContinuing] = useState(false);
  const [continueError, setContinueError] = useState<string | null>(null);

  const handleContinue = async () => {
    setIsContinuing(true);
    setContinueError(null);
    try {
      const result = await setStorageProvider('s3');
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
      const result = await saveS3Config(rawData);

      if (!result.success) {
        return {
          success: false as const,
          fieldErrors: result.fieldErrors ?? {},
          formErrors: 'error' in result && result.error ? [result.error] : [],
        };
      }

      router.push('/setup?step=3');
      return { success: true as const };
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
    <Form onSubmit={handleSubmit}>
      {disabled && (
        <Alert variant="info">
          <AlertDescription>
            {intl.formatMessage(
              messages.theseS3SettingsAreConfiguredViaEnvironment,
            )}
          </AlertDescription>
        </Alert>
      )}
      <Field
        name="s3Endpoint"
        label={intl.formatMessage(messages.endpointURL)}
        placeholder={exampleUrls.endpoint}
        hint={intl.formatMessage(messages.theS3CompatibleEndpointURL)}
        custom={{
          schema: s3ConfigSchema.shape.s3Endpoint,
          hint: intl.formatMessage(messages.required),
        }}
        component={InputField}
        type="text"
        disabled={disabled}
        initialValue={defaultValues?.s3Endpoint}
      />
      <Field
        name="s3PublicUrl"
        label={intl.formatMessage(messages.publicURL)}
        placeholder={exampleUrls.public}
        hint={intl.formatMessage(messages.theURLBrowsersUseToReachThis)}
        custom={{
          schema: s3ConfigSchema.shape.s3PublicUrl,
          hint: intl.formatMessage(messages.required),
        }}
        component={InputField}
        type="text"
        disabled={disabled}
        initialValue={defaultValues?.s3PublicUrl}
      />
      <Field
        name="s3Bucket"
        label={intl.formatMessage(messages.bucketName)}
        placeholder={intl.formatMessage(messages.myFrescoBucket)}
        custom={{
          schema: s3ConfigSchema.shape.s3Bucket,
          hint: intl.formatMessage(messages.required),
        }}
        component={InputField}
        type="text"
        disabled={disabled}
        initialValue={defaultValues?.s3Bucket}
      />
      <Field
        name="s3Region"
        label={intl.formatMessage(messages.region)}
        placeholder={intl.formatMessage(messages.usEast1)}
        custom={{
          schema: s3ConfigSchema.shape.s3Region,
          hint: intl.formatMessage(messages.required),
        }}
        component={InputField}
        type="text"
        disabled={disabled}
        initialValue={defaultValues?.s3Region}
      />
      <Field
        name="s3AccessKeyId"
        label={intl.formatMessage(messages.accessKeyID)}
        placeholder={intl.formatMessage(messages.aKIAIOSFODNN7EXAMPLE)}
        custom={{
          schema: s3ConfigSchema.shape.s3AccessKeyId,
          hint: intl.formatMessage(messages.required),
        }}
        component={InputField}
        type="text"
        disabled={disabled}
        initialValue={defaultValues?.s3AccessKeyId}
      />
      <Field
        name="s3SecretAccessKey"
        label={intl.formatMessage(messages.secretAccessKey)}
        placeholder={intl.formatMessage(
          messages.wJalrXUtnFEMIK7MDENGBPxRfiCYEXAMPLEKEY,
        )}
        custom={{
          schema: s3ConfigSchema.shape.s3SecretAccessKey,
          hint: intl.formatMessage(messages.required),
        }}
        component={InputField}
        type="password"
        disabled={disabled}
        initialValue={defaultValues?.s3SecretAccessKey}
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
        <SubmitButton className="mt-6">
          {intl.formatMessage(messages.saveAndContinue)}
        </SubmitButton>
      )}
    </Form>
  );
};

// Example URLs remain valid data in every locale.
const exampleUrls = {
  endpoint: 'https://s3.amazonaws.com',
  public: 'https://app.example.com',
};
