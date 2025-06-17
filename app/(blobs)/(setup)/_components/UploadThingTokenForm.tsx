import { Loader2 } from 'lucide-react';
import { z } from 'zod/v3';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import useZodForm from '~/hooks/useZodForm';
import { createUploadThingTokenSchema } from '~/schemas/appSettings';

export const UploadThingTokenForm = ({
  action,
}: {
  action: (token: string) => Promise<string | void>;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useZodForm({
    schema: z.object({
      uploadThingToken: createUploadThingTokenSchema,
    }),
  });

  const onSubmit = async ({
    uploadThingToken,
  }: {
    uploadThingToken: string;
  }) => {
    await action(uploadThingToken);
  };

  return (
    <form
      className="flex w-full flex-col"
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
    >
      <div className="mb-6 flex">
        <Input
          className="w-full"
          label="UPLOADTHING_TOKEN"
          hint="Copy and paste the full token from your UploadThing dashboard."
          type="text"
          placeholder="UPLOADTHING_TOKEN=******************"
          error={errors.uploadThingToken?.message}
          {...register('uploadThingToken')}
        />
      </div>
      <div className="flex flex-wrap justify-end">
        <Button disabled={isSubmitting || !isValid} type="submit">
          {isSubmitting && <Loader2 className="mr-2 animate-spin" />}
          {isSubmitting ? 'Saving...' : 'Save and continue'}
        </Button>
      </div>
    </form>
  );
};
