'use client';

import { setAppSetting } from '~/actions/appSettings';
import Link from '~/components/Link';
import { Button } from '~/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Input } from '~/components/ui/Input';
import useZodForm from '~/hooks/useZodForm';
import { createEnvironmentSchema } from '~/schemas/environment';

const setTokenSchema = createEnvironmentSchema.pick({
  uploadThingToken: true,
});

function UploadThingModal() {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useZodForm({
    schema: setTokenSchema,
  });

  const onSubmit = async ({
    uploadThingToken,
  }: {
    uploadThingToken: string;
  }) => {
    await setAppSetting('uploadThingToken', uploadThingToken);
  };

  return (
    <Dialog open={true}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Required Environment Variable Update</DialogTitle>
          <DialogDescription>
            This Fresco update requires a new UploadThing environment variable.
            Please add it by following these steps.
            <ol className="list-inside list-decimal">
              <li>
                Visit the{' '}
                <Link
                  href="https://uploadthing.com/dashboard/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  UploadThing dashboard
                </Link>
              </li>
              <li>Select your project</li>
              <li>Select the API Keys tab</li>
              <li>Copy the token by clicking the Copy button</li>
              <li>
                Paste the token into the field below and click the Submit button
              </li>
            </ol>
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col"
          onSubmit={(event) => void handleSubmit(onSubmit)(event)}
        >
          <div className="mb-6 w-full">
            <Input
              label="UPLOADTHING_TOKEN"
              type="text"
              placeholder="abcd******************"
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
      </DialogContent>
    </Dialog>
  );
}

export default UploadThingModal;
