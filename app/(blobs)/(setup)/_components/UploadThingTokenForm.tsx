'use client';

import { Field, Form, SubmitButton } from '~/lib/form';
import { InputField } from '~/lib/form/components/fields/InputField';
import { createUploadThingTokenSchema } from '~/schemas/appSettings';

export const UploadThingTokenForm = ({
  action,
}: {
  action: (token: string) => Promise<string | void>;
}) => {
  const handleSubmit = async (data: unknown) => {
    const typedData = data as { uploadThingToken: string };
    await action(typedData.uploadThingToken);
    return {
      success: true,
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
