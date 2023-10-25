'use client';

import { Button } from '~/components/ui/Button';
import useZodForm from '~/hooks/useZodForm';
import { Input } from '~/components/ui/Input';
import { type UserSignupData, userFormSchema } from '../_shared';
import { Loader2 } from 'lucide-react';
import { api } from '~/trpc/client';
import { useState } from 'react';
import ActionError from '../../../components/ActionError';

export const SignUpForm = ({
  completeCallback,
}: {
  completeCallback?: () => void;
}) => {
  const [signupError, setSignupError] = useState<string | null>(null);
  const utils = api.useUtils();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useZodForm({
    schema: userFormSchema,
    mode: 'all',
  });

  const { mutateAsync: signUp, isLoading } = api.session.signUp.useMutation({
    onSuccess: async (result) => {
      if (result.error) {
        const error = result.error;
        setSignupError(error);
        return;
      }

      if (result.user) {
        // We got a user, so the auth cookie was set. Trigger a refresh of the
        // session provider. This is so that the OnboardWizard can redirect to
        // the next step.
        await utils.session.get.refetch();

        completeCallback?.();
      }
    },
  });

  const onSubmit = async (data: UserSignupData) => {
    setSignupError(null);
    await signUp(data);
  };

  return (
    <form
      className="flex flex-col"
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
      autoComplete="do-not-autofill"
    >
      {signupError && (
        <div className="mb-6 flex flex-wrap">
          <ActionError
            errorTitle="There was a problem creating your account"
            errorDescription={signupError}
          />
        </div>
      )}
      <div className="mb-6 flex flex-wrap">
        <Input
          label="Username"
          hint="Your username should be at least 4 characters, and must not contain any spaces."
          type="text"
          placeholder="username..."
          autoComplete="do-not-autofill"
          error={errors.username?.message}
          {...register('username')}
        />
      </div>
      <div className="mb-6 flex flex-wrap">
        <Input
          label="Password"
          hint="Your password must be at least 8 characters long, and contain at least one each of lowercase, uppercase, number and symbol characters."
          type="password"
          placeholder="******************"
          autoComplete="do-not-autofill"
          error={errors.password?.message}
          {...register('password')}
        />
      </div>
      <div className="flex flex-wrap">
        {isLoading ? (
          <Button disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </Button>
        ) : (
          <Button type="submit" disabled={!isValid}>
            Create account
          </Button>
        )}
      </div>
    </form>
  );
};
