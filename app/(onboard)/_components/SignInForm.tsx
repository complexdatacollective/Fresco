'use client';

import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { formValidationSchema } from '../_shared';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SignInForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(formValidationSchema),
  });

  const router = useRouter();

  const onSubmit = async (data: unknown) => {
    const result = formValidationSchema.parse(data);

    // The route handler wants this in the form of a FormData object
    const formData = new FormData();
    formData.append('username', result.username);
    formData.append('password', result.password);

    const response = await fetch('/api/auth/signin', {
      method: 'POST',
      body: formData,
      redirect: 'manual',
    });

    if (response.status === 0) {
      // when using `redirect: "manual"`, response status 0 is returned
      router.replace('/dashboard');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex w-full flex-col">
      <div className="mb-6 flex flex-wrap">
        <Input
          label="Username"
          autoComplete="username"
          {...register('username')}
        />
        {errors.username?.message && <p>{errors.username?.message}</p>}
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
