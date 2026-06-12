'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Alert, AlertDescription } from '@codaco/fresco-ui/Alert';
import { Button } from '@codaco/fresco-ui/Button';
import Field from '@codaco/fresco-ui/form/Field/Field';
import Form from '@codaco/fresco-ui/form/Form';
import SubmitButton from '@codaco/fresco-ui/form/SubmitButton';
import InputField from '@codaco/fresco-ui/form/fields/InputField';
import { saveS3Config, setStorageProvider } from '~/actions/storageProvider';
import { type S3EnvValues, s3ConfigSchema } from '~/schemas/s3Settings';

export const S3ConfigForm = ({
  disabled = false,
  defaultValues,
}: {
  disabled?: boolean;
  defaultValues?: S3EnvValues;
}) => {
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
      setContinueError(
        caught instanceof Error
          ? caught.message
          : 'An unexpected error occurred',
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
      const message =
        error instanceof Error ? error.message : 'An unexpected error occurred';
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
            These S3 settings are configured via environment variables and
            cannot be changed here.
          </AlertDescription>
        </Alert>
      )}
      <Field
        name="s3Endpoint"
        label="Endpoint URL"
        placeholder="https://s3.amazonaws.com"
        hint="The S3-compatible endpoint URL"
        custom={{ schema: s3ConfigSchema.shape.s3Endpoint, hint: 'Required' }}
        component={InputField}
        type="text"
        disabled={disabled}
        initialValue={defaultValues?.s3Endpoint}
      />
      <Field
        name="s3PublicUrl"
        label="Public URL"
        placeholder="https://app.example.com"
        hint="The URL browsers use to reach this storage. For MinIO behind your reverse proxy, this is your Fresco domain (see deployment docs). For AWS S3 or R2, this is usually the same as the Endpoint URL."
        custom={{ schema: s3ConfigSchema.shape.s3PublicUrl, hint: 'Required' }}
        component={InputField}
        type="text"
        disabled={disabled}
        initialValue={defaultValues?.s3PublicUrl}
      />
      <Field
        name="s3Bucket"
        label="Bucket Name"
        placeholder="my-fresco-bucket"
        custom={{ schema: s3ConfigSchema.shape.s3Bucket, hint: 'Required' }}
        component={InputField}
        type="text"
        disabled={disabled}
        initialValue={defaultValues?.s3Bucket}
      />
      <Field
        name="s3Region"
        label="Region"
        placeholder="us-east-1"
        custom={{ schema: s3ConfigSchema.shape.s3Region, hint: 'Required' }}
        component={InputField}
        type="text"
        disabled={disabled}
        initialValue={defaultValues?.s3Region}
      />
      <Field
        name="s3AccessKeyId"
        label="Access Key ID"
        placeholder="AKIAIOSFODNN7EXAMPLE"
        custom={{
          schema: s3ConfigSchema.shape.s3AccessKeyId,
          hint: 'Required',
        }}
        component={InputField}
        type="text"
        disabled={disabled}
        initialValue={defaultValues?.s3AccessKeyId}
      />
      <Field
        name="s3SecretAccessKey"
        label="Secret Access Key"
        placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
        custom={{
          schema: s3ConfigSchema.shape.s3SecretAccessKey,
          hint: 'Required',
        }}
        component={InputField}
        type="password"
        disabled={disabled}
        initialValue={defaultValues?.s3SecretAccessKey}
      />
      {disabled ? (
        <>
          {continueError && (
            <p className="text-destructive text-sm">{continueError}</p>
          )}
          <Button
            onClick={handleContinue}
            color="primary"
            disabled={isContinuing}
            className="self-start"
          >
            {isContinuing ? 'Saving...' : 'Continue'}
          </Button>
        </>
      ) : (
        <SubmitButton className="mt-6">Save and continue</SubmitButton>
      )}
    </Form>
  );
};
