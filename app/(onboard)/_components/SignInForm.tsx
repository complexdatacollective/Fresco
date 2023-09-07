'use client';

import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { formValidationSchema } from '../_shared';
import { Loader2 } from 'lucide-react';

export default function SignInForm() {
  const {
    register,
    handleSubmit,
    // watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(formValidationSchema),
  });

  const onSubmit = async (data: unknown) => {
    const result = formValidationSchema.parse(data);

    console.log(result);
    const sign = await signIn('credentials', {
      email: result.email,
      password: result.password,
      redirect: false,
      callbackUrl: '/dashboard',
    });

    console.log(sign);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex w-full flex-col">
      <div className="mb-6 flex flex-wrap">
        <Input
          type="email"
          label="E-mail Address"
          autoComplete="email"
          {...register('email')}
        />
        {errors.email?.message && <p>{errors.email?.message}</p>}
      </div>
      <div className="mb-6 flex flex-wrap">
        <Input
          type="password"
          label="Password"
          autoComplete="current-password"
          {...register('password')}
        />
        {errors.password?.message && <p>{errors.password?.message}</p>}
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
