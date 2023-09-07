'use client';
import { Button } from '~/components/ui/Button';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Input } from '~/components/ui/Input';
import { formValidationSchema } from '../_shared';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export const SignUpForm = () => {
  const {
    register,
    handleSubmit,
    // watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(formValidationSchema),
  });

  const router = useRouter();

  const onSubmit = async (data: unknown) => {
    const result = formValidationSchema.parse(data);

    const formData = new FormData();

    formData.append('username', result.username);
    formData.append('password', result.password);

    const response = await fetch('/api/auth/signup', {
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
    <form
      className="flex w-full flex-col"
      onSubmit={handleSubmit(onSubmit)}
      autoComplete="do-not-autofill"
    >
      <div className="mb-6 flex flex-wrap">
        <Input
          label="Username"
          type="text"
          placeholder="username..."
          autoComplete="do-not-autofill"
          {...register('username')}
        />
        {errors.username?.message && <p>{errors.username?.message}</p>}
      </div>
      <div className="mb-6 flex flex-wrap">
        <Input
          label="Password"
          type="password"
          placeholder="******************"
          autoComplete="do-not-autofill"
          {...register('password')}
        />
        {errors.password?.message && <p>{errors.password?.message}</p>}
      </div>
      <div className="flex flex-wrap">
        {isSubmitting ? (
          <Button disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </Button>
        ) : (
          <Button type="submit">Create account</Button>
        )}
      </div>
    </form>
  );
};
