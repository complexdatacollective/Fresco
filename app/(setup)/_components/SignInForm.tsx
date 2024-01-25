'use client';

import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { userFormSchema } from '../_shared';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { api } from '~/trpc/client';
import ActionError from '../../../components/ActionError';
import type { Route } from 'next';
import useZodForm from '~/hooks/useZodForm';
import { useRouter } from 'next/navigation';

type ResponseError = {
  title: string;
  description: string;
};

export default function SignInForm({ callbackUrl }: { callbackUrl?: Route }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [responseError, setResponseError] = useState<ResponseError | null>(
    null,
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useZodForm({
    schema: userFormSchema,
  });

  const { mutateAsync: signIn } = api.session.signIn.useMutation({
    onMutate: () => setLoading(true),
    onSuccess: (result) => {
      if (result.error) {
        setLoading(false); // Only reset loading state on error, otherwise we are signing in...
        setResponseError({
          title: 'Sign in failed',
          description: result.error,
        });
      }

      if (result.session) {
        if (callbackUrl) {
          // For some reason, using the router causes the component to re-render
          // which in turn causes a flash. Using window.location.replace() does
          // not cause this issue.

          router.replace(callbackUrl);
          // window.location.replace(callbackUrl);
        } else {
          router.replace('/dashboard');
          // window.location.replace('/dashboard');
        }
      }
    },
    onError: (error) => {
      setLoading(false);
      throw new Error(error.message);
    },
  });

  const onSubmit = async (data: unknown) => {
    const payload = userFormSchema.parse(data);
    await signIn(payload);
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
          {...register('username')}
        />
      </div>
      <div className="mb-6 flex flex-wrap">
        <Input
          type="password"
          label="Password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
      </div>
      <div className="flex flex-wrap">
        {loading ? (
          <Button disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </Button>
        ) : (
          <Button type="submit">Sign in</Button>
        )}
      </div>
    </form>
  );
}
