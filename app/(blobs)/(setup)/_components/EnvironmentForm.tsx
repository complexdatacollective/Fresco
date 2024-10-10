'use client';

import { storeEnvironment } from '~/actions/appSettings';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import useZodForm from '~/hooks/useZodForm';
import { createEnvironmentSchema } from '~/schemas/environment';

export const EnvironmentForm = ({
  installationId,
}: {
  installationId: string | null;
}) => {
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
          hint="Copy the full token from the dashboard."
          type="text"
          placeholder="UPLOADTHING_TOKEN=******************"
          error={errors.uploadThingToken?.message}
          {...register('uploadThingToken')}
        />
      </div>
      <div className="mb-6 flex flex-wrap">
        <Input
          label="Public URL"
          hint="When using advanced deployment, this is required. Set to the domain name of your app"
          type="text"
          placeholder="app-id..."
          error={errors.publicUrl?.message}
          {...register('publicUrl')}
        />
      </div>
      {!installationId && (
        <div className="mb-6 flex flex-wrap">
          <Input
            label="Installation Id"
            hint="A unique identifier for your app, used for analytics. Generated automatically if not set."
            type="text"
            placeholder="app-id..."
            error={errors.installationId?.message}
            {...register('installationId')}
          />
        </div>
      )}
      <div className="flex flex-wrap">
        <Button disabled={!isValid} type="submit">
          Submit
        </Button>
      </div>
    </form>
  );
};
