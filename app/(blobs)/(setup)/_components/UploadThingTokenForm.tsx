'use client';

import { useRouter } from 'next/navigation';
import { setUploadThingToken } from '~/actions/appSettings';
import { setStorageProvider } from '~/actions/storageProvider';
import Field from '@codaco/fresco-ui/form/Field/Field';
import Form from '@codaco/fresco-ui/form/Form';
import SubmitButton from '@codaco/fresco-ui/form/SubmitButton';
import InputField from '@codaco/fresco-ui/form/fields/InputField';
import { createUploadThingTokenSchema } from '~/schemas/appSettings';

export const UploadThingTokenForm = () => {
  const router = useRouter();

  const handleSubmit = async (rawData: unknown) => {
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
      />
      <SubmitButton key="submit" className="mt-6">
        Save and continue
      </SubmitButton>
    </Form>
  );
};
