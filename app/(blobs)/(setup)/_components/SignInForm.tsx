'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { login } from '~/actions/auth';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import UnorderedList from '~/components/ui/typography/UnorderedList';
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

  const { toast } = useToast();
  const router = useRouter();

  const onSubmit = async (data: unknown) => {
    const result = await login(data);

    if (result.success === true) {
      router.push('/dashboard');
      return;
    }

    // Handle formErrors
    if (result.formErrors.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Login failed',
        description: (
          <>
            <UnorderedList>
              {result.formErrors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </UnorderedList>
          </>
        ),
      });
    }

    // Handle field errors
    if (result.fieldErrors) {
      for (const [field, message] of Object.entries(result.fieldErrors)) {
        setError(`root.${field}`, { types: { type: 'manual', message } });
      }
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
