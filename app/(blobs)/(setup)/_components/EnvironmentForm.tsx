'use client';

import { parseAsInteger, useQueryState } from 'nuqs';
import { storeEnvironment } from '~/actions/environment';
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
          type="password"
          placeholder="app-id..."
          error={errors.UPLOADTHING_APP_ID?.message}
          {...register('UPLOADTHING_APP_ID')}
        />
      </div>
      <div className="flex flex-wrap">
        <Button type="submit" disabled={!isValid}>
          Save
        </Button>
        <Button onClick={handleNextStep}>Proceed</Button>
      </div>
    </form>
  );
};
