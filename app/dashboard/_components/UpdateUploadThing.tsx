'use client';

import { Loader2 } from 'lucide-react';
import { Suspense, useState } from 'react';
import { setAppSetting } from '~/actions/appSettings';
import SettingsSection from '~/components/layout/SettingsSection';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
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
    formState: { errors, isValid, isSubmitting },
  } = useZodForm({
    schema: createUploadThingTokenForm,
  });
  const handleEdit = () => {
    setInputDisabled(false);
  };
  const onSubmit = async ({
    uploadThingToken,
  }: {
    uploadThingToken: string;
  }) => {
    await setAppSetting('uploadThingToken', uploadThingToken);
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
              <Button disabled={isSubmitting || !isValid} type="submit">
                {isSubmitting && <Loader2 className="mr-2 animate-spin" />}
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            )}
          </Suspense>
        }
      >
        <Paragraph margin="none">
          This is the API key used to communicate with the UploadThing service.
        </Paragraph>

        <Input
          type="text"
          placeholder={uploadThingKey}
          error={errors.uploadThingToken?.message}
          {...register('uploadThingToken')}
          disabled={inputDisabled}
        />
      </SettingsSection>
    </form>
  );
}
