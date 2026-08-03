'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Alert, AlertDescription } from '@codaco/fresco-ui/Alert';
import { Button } from '@codaco/fresco-ui/Button';
import Field from '@codaco/fresco-ui/form/Field/Field';
import Form from '@codaco/fresco-ui/form/Form';
import SubmitButton from '@codaco/fresco-ui/form/SubmitButton';
import InputField from '@codaco/fresco-ui/form/fields/InputField';
import { setUploadThingToken } from '~/actions/appSettings';
import { setStorageProvider } from '~/actions/storageProvider';
import { createUploadThingTokenSchema } from '~/schemas/appSettings';

export const UploadThingTokenForm = ({
  disabled = false,
}: {
  disabled?: boolean;
}) => {
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
            providerResult.error ?? 'Failed to set storage provider.',
          ],
        };
      }

      router.push('/setup?step=3');

      return {
        success: true as const,
      };
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
            The UploadThing token is configured via an environment variable and
            cannot be changed here.
          </AlertDescription>
        </Alert>
      )}
      <Field
        key="uploadThingToken"
        name="uploadThingToken"
        label="UPLOADTHING_TOKEN"
        placeholder="UPLOADTHING_TOKEN=******************"
        hint="Copy and paste the full token from your UploadThing dashboard."
        custom={{
          schema: createUploadThingTokenSchema,
          hint: 'Paste the full token including the UPLOADTHING_TOKEN= prefix',
        }}
        component={InputField}
        type="text"
        disabled={disabled}
        initialValue={disabled ? 'UPLOADTHING_TOKEN=••••••••' : undefined}
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
        <SubmitButton key="submit" className="mt-6">
          Save and continue
        </SubmitButton>
      )}
    </Form>
  );
};
