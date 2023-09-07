'use client';
import { handleSubmit as serverHandleSubmit } from '~/app/(onboard)/signup/_actions';
import { Button } from '~/components/ui/Button';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Input } from '~/components/ui/Input';

export const formValidationSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters' }),
});

export type SignUpData = z.infer<typeof formValidationSchema>;

export const SignUpForm: React.FC = () => {
  const {
    register,
    handleSubmit,
    // watch,
    formState: { errors },
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
        <Button>Create Account</Button>
      </div>
    </form>
  );
};
