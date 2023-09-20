'use client';

import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { type UserSignupData, userFormSchema } from '../_shared';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { trpc } from '~/app/_trpc/client';
import ActionError from '../../../components/ActionError';

type ResponseError = {
  title: string;
  description: string;
};

export default function SignInForm({ callbackUrl }: { callbackUrl?: string }) {
  const [loading, setLoading] = useState(false);

  const [responseError, setResponseError] = useState<ResponseError | null>(
    null,
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserSignupData>({
    resolver: zodResolver(userFormSchema),
  });

  const router = useRouter();

  const { mutateAsync: signIn } = trpc.signIn.useMutation({
    onMutate: () => setLoading(true),
  });

  const onSubmit = async (data: unknown) => {
    const payload = userFormSchema.parse(data);
    const result = await signIn(payload);

    if (result.error) {
      setLoading(false);
      setResponseError({
        title: 'Sign in failed',
        description: result.error,
      });
    }

    if (result.session) {
      setLoading(false);
      if (callbackUrl) {
        router.replace(callbackUrl);
      }
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
