'use client';

import { parseAsInteger, useQueryState } from 'nuqs';
import { storeEnvironment } from '~/actions/environment';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import SubmitButton from '~/components/ui/SubmitButton';
import useZodForm from '~/hooks/useZodForm';
import { createEnvironmentSchema } from '~/schemas/environment';

export const EnvironmentForm = () => {
  const {
    register,
    formState: { errors, isValid },
  } = useZodForm({
    schema: createEnvironmentSchema,
  });

  const [currentStep, setCurrentStep] = useQueryState(
    'step',
    parseAsInteger.withDefault(1),
  );

  const handleNextStep = () => {
    void setCurrentStep(currentStep + 1);
  };

  return (
    <form className="flex flex-col" action={storeEnvironment}>
      <div className="mb-6 flex flex-wrap">
        <Input
          label="UPLOADTHING_SECRET"
          hint="Copy from the dashboard"
          type="text"
          placeholder="sk_live_******************"
          error={errors.UPLOADTHING_SECRET?.message}
          {...register('UPLOADTHING_SECRET')}
        />
      </div>
      <div className="mb-6 flex flex-wrap">
        <Input
          label="UPLOADTHING_APP_ID"
          hint="Copy from the dashboard"
          type="text"
          placeholder="app-id..."
          error={errors.UPLOADTHING_APP_ID?.message}
          {...register('UPLOADTHING_APP_ID')}
        />
      </div>
      <div className="mb-6 flex flex-wrap">
        <Input
          label="PUBLIC_URL"
          hint="When using advanced deployment, this is required. Set to the domain name of your app"
          type="text"
          placeholder="app-id..."
          error={errors.PUBLIC_URL?.message}
          {...register('PUBLIC_URL')}
        />
      </div>
      <div className="mb-6 flex flex-wrap">
        <Input
          label="INSTALLATION_ID"
          hint="A unique identifier for your app, used for analytics. Generated automatically if not set."
          type="text"
          placeholder="app-id..."
          error={errors.INSTALLATION_ID?.message}
          {...register('INSTALLATION_ID')}
        />
      </div>
      <div className="flex flex-wrap">
        <SubmitButton type="submit" disabled={!isValid}>
          Submit
        </SubmitButton>
        <Button onClick={handleNextStep}>Proceed</Button>
      </div>
    </form>
  );
};
