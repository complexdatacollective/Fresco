'use client';

import { useState } from 'react';
import { safeLogin } from '~/actions/auth';
import ActionError from '~/components/ActionError';
import { Input } from '~/components/ui/Input';
import SubmitButton from '~/components/ui/SubmitButton';
import useZodForm from '~/hooks/useZodForm';
import { loginSchema } from '~/schemas/auth';

type ResponseError = {
  title: string;
  description: string;
};

export const SignInForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useZodForm({
    schema: loginSchema,
    mode: 'all',
  });

  const [responseError, setResponseError] = useState<ResponseError | null>(
    null,
  );

  const onSubmit = async ({
    username,
    password,
  }: {
    username?: unknown;
    password?: unknown;
  }) => {
    const result = await safeLogin({ username, password });
    if (!result?.data) {
      return;
    }

    if (result.data?.error) {
      setResponseError({
        title: 'Sign In Failed',
        description: result.data.error,
      });
    }
  };

  return (
    <form
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
      className="flex w-full flex-col"
    >
      {responseError && (
        <div className="mb-6 flex flex-wrap">
          <ActionError
            errorTitle={responseError.title}
            errorDescription={responseError.description}
          />
        </div>
      )}
      <div className="mb-6 flex flex-wrap">
        <Input
          label="Username"
          autoComplete="username"
          error={errors.username?.message}
          className="w-full"
          {...register('username')}
        />
      </div>
      <div className="mb-6 flex flex-wrap">
        <Input
          type="password"
          label="Password"
          autoComplete="current-password"
          className="w-full"
          error={errors.password?.message}
          {...register('password')}
        />
      </div>
      <div className="flex flex-wrap">
        <SubmitButton>Sign In</SubmitButton>
      </div>
    </form>
  );
};
