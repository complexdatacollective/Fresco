'use client';

import { useRouter } from 'next/navigation';
import { setUploadThingToken } from '~/actions/appSettings';
import Field from '~/lib/form/components/Field/Field';
import Form from '~/lib/form/components/Form';
import SubmitButton from '~/lib/form/components/SubmitButton';
import InputField from '~/lib/form/components/fields/InputField';
import { createUploadThingTokenSchema } from '~/schemas/appSettings';

export const UploadThingTokenForm = () => {
  const router = useRouter();

  const handleSubmit = async (rawData: unknown) => {
    const result = await setUploadThingToken(rawData);

    if (!result.success) {
      return {
        success: false as const,
        fieldErrors: result.fieldErrors,
      };
    }

    // Navigate to step 3 (Upload Protocol)
    router.push('/setup?step=3');

    return {
      success: true as const,
    };
  };

  return (
    <Form onSubmit={handleSubmit} className="flex w-full flex-col">
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
