'use client';
import { Button } from '~/components/ui/Button';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Input } from '~/components/ui/Input';
import { formValidationSchema } from '../_shared';
import { handleSubmit as serverHandleSubmit } from '../signup/_actions';
import { Loader2 } from 'lucide-react';

export const SignUpForm = () => {
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
    await serverHandleSubmit(result);
  };

  return (
    <form
      className="flex w-full flex-col"
      onSubmit={handleSubmit(onSubmit)}
      autoComplete="do-not-autofill"
    >
      <div className="mb-6 flex flex-wrap">
        <Input
          label="E-mail Address"
          type="email"
          placeholder="you@somewhere.com"
          autoComplete="do-not-autofill"
          {...register('email')}
        />
        {errors.email?.message && <p>{errors.email?.message}</p>}
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
