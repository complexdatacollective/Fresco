'use client';

import { storeEnvironment } from '~/actions/appSettings';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import useZodForm from '~/hooks/useZodForm';
import { createEnvironmentSchema } from '~/schemas/environment';

export const EnvironmentForm = () => {
  const {
    register,
    formState: { errors, isValid },
  } = useZodForm({
    schema: createEnvironmentSchema,
  });

  return (
    <form className="flex flex-col" action={storeEnvironment}>
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
        <Button disabled={!isValid} type="submit">
          Submit
        </Button>
      </div>
    </form>
  );
};
