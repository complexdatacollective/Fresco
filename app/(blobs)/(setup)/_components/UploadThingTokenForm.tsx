'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { setAppSetting } from '~/actions/appSettings';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import useZodForm from '~/hooks/useZodForm';
import { createUploadThingTokenForm } from '~/schemas/environment';

export const UploadThingTokenForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useZodForm({
    schema: createUploadThingTokenForm,
  });
  const router = useRouter();

  const onSubmit = async ({
    uploadThingToken,
  }: {
    uploadThingToken: string;
  }) => {
    await setAppSetting('uploadThingToken', uploadThingToken);
    router.push('/setup?step=3');
  };

  return (
    <form
      className="flex flex-col"
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
    >
      <div className="mb-6 flex">
        <Input
          label="UPLOADTHING_TOKEN"
          hint="Copy and paste the full token from your UploadThing dashboard."
          type="text"
          placeholder="UPLOADTHING_TOKEN=******************"
          error={errors.uploadThingToken?.message}
          {...register('uploadThingToken')}
        />
      </div>
      <div className="flex flex-wrap">
        <Button disabled={isSubmitting || !isValid} type="submit">
          {isSubmitting && <Loader2 className="mr-2 animate-spin" />}
          {isSubmitting ? 'Saving...' : 'Save and continue'}
        </Button>
      </div>
    </form>
  );
};
