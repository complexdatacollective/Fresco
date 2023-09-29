'use client';

import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { userFormSchema } from '../_shared';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { useAction } from '~/app/_trpc/client';
import ActionError from '../../../components/ActionError';
import useZodForm from '~/utils/useZodForm';
import { signInAction } from '~/app/_actions/session';

export default function SignInForm({ callbackUrl }: { callbackUrl?: string }) {
  const [responseError, setResponseError] = useState<ResponseError | null>(
    null,
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useZodForm({
    schema: userFormSchema,
  });

  const formRef = useRef<HTMLFormElement>(null);

  const { mutateAsync } = useAction(signInAction, {
    onError: (error) => {
      setResponseError({
        title: 'Sign in failed',
        description: error,
      });
    },
  });

  const router = useRouter();

  // const { mutate: signIn } = trpcReact.session.signIn.useMutation({
  //   onMutate: () => setLoading(true),
  //   onSuccess: async (result) => {
  //     console.log(result);
  //     if (result.error) {
  //       setLoading(false);
  //       setResponseError({
  //         title: 'Sign in failed',
  //         description: result.error,
  //       });
  //     }

  //     if (result.session) {
  //       if (callbackUrl) {
  //         console.log('callbackUrl', callbackUrl);
  //         router.replace(callbackUrl);
  //       }
  //     }
  //   },
  // });

  const onSubmit = async () => {
    await mutateAsync(new FormData(formRef.current));
  };

  return (
    <form
      action={signInAction}
      ref={formRef}
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
        {isSubmitting ? (
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
