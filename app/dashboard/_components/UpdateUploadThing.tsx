'use client';

import { useRouter } from 'next/navigation';
import { Suspense, useState } from 'react';
import { setAppSetting } from '~/actions/appSettings';
import SettingsSection from '~/components/layout/SettingsSection';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import SubmitButton from '~/components/ui/SubmitButton';
import Paragraph from '~/components/ui/typography/Paragraph';
import useZodForm from '~/hooks/useZodForm';
import { createUploadThingTokenForm } from '~/schemas/environment';

export default function UpdateUploadThingSection({
  uploadThingKey,
}: {
  uploadThingKey: string;
}) {
  const [inputDisabled, setInputDisabled] = useState(true);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useZodForm({
    schema: createUploadThingTokenForm,
  });
  const handleEdit = () => {
    setInputDisabled(false);
  };
  const router = useRouter();
  const onSubmit = async ({
    uploadThingToken,
  }: {
    uploadThingToken: string;
  }) => {
    await setAppSetting('uploadThingToken', uploadThingToken);
    router.refresh();
    setInputDisabled(true);
  };
  return (
    <form
      className="flex flex-col"
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
    >
      <SettingsSection
        heading="UploadThing API Key"
        controlArea={
          <Suspense fallback="Loading">
            {inputDisabled ? (
              <Button onClick={handleEdit}>Edit</Button>
            ) : (
              <SubmitButton>Save</SubmitButton>
            )}
          </Suspense>
        }
      >
        <Paragraph margin="none">
          This is the API key used to communicate with the UploadThing service.
        </Paragraph>
        {inputDisabled ? (
          <Input value={uploadThingKey} disabled={inputDisabled} />
        ) : (
          <Input
            type="text"
            error={errors.uploadThingToken?.message}
            {...register('uploadThingToken')}
          />
        )}
      </SettingsSection>
    </form>
  );
}
