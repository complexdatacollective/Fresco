'use client';

import { Field, Form, SubmitButton } from '~/lib/form';
import { InputField } from '~/lib/form/components/fields/Input';
import { createUploadThingTokenSchema } from '~/schemas/appSettings';

export const UploadThingTokenForm = ({
  action,
}: {
  action: (token: string) => Promise<string | void>;
}) => {
  const handleSubmit = async (data) => {
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
        validation={createUploadThingTokenSchema}
        Component={InputField}
        type="text"
      />
      <SubmitButton key="submit" className="mt-6">
        Save and continue
      </SubmitButton>
    </Form>
  );
};
