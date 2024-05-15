'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { login } from '~/actions/auth';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { useToast } from '~/components/ui/use-toast';
import useZodForm from '~/hooks/useZodForm';
import { loginSchema } from '~/schemas/auth';

export const SignInForm = () => {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useZodForm({
    schema: loginSchema,
  });

  console.log('errors', errors);

  const { toast } = useToast();
  const router = useRouter();

  const onSubmit = async (data: unknown) => {
    const result = await login(data);
    console.log(result);
    if (result.success) {
      router.push('/dashboard');
      return;
    }

    // We have either a global error or field errors
    if (result.fieldErrors) {
      for (const error of result.fieldErrors) {
        console.log('setting', error);
        setError(error.path, {
          message: error.message,
        });
      }
    }

    // Global error
    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'An error occurred',
        description: result.error,
      });
    }
  };

  return (
    <form
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
      className="flex w-full flex-col"
    >
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
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting && <Loader2 className="mr-2 animate-spin" />}
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </Button>
      </div>
    </form>
  );
};
