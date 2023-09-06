'use client';
import { handleSubmit as serverHandleSubmit } from '~/app/(onboard)/signup/_actions';
import { Button } from '~/components/ui/Button';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

export const formValidationSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters' }),
});

export type SignUpData = z.infer<typeof formValidationSchema>;

export const SignUp: React.FC = () => {
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
    <>
      <form className="" onSubmit={handleSubmit(onSubmit)}>
        <div className="m-6 -mx-3 flex flex-wrap">
          <div className="w-full px-3">
            <label
              className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-700"
              htmlFor="grid-email"
            >
              E-Mail Address
            </label>
            <input
              className="mb-3 block w-full appearance-none rounded border border-gray-200 bg-gray-200 px-4 py-3 leading-tight text-gray-700 focus:border-gray-500 focus:bg-white focus:outline-none"
              required
              placeholder="you@example.com"
              defaultValue=""
              {...register('email')}
            />
            {errors.email?.message && <p>{errors.email?.message}</p>}
          </div>
        </div>
        <div className="-mx-3 mb-6 flex flex-wrap">
          <div className="w-full px-3">
            <label
              className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-700"
              htmlFor="grid-password"
            >
              Password
            </label>
            <input
              type="password"
              className="mb-3 block w-full appearance-none rounded border border-gray-200 bg-gray-200 px-4 py-3 leading-tight text-gray-700 focus:border-gray-500 focus:bg-white focus:outline-none"
              required
              placeholder="******************"
              {...register('password')}
            />
            {errors.password?.message && <p>{errors.password?.message}</p>}
            <p className="text-xs italic text-gray-600">
              Make it as long and as crazy as you&apos;d like
            </p>
          </div>
        </div>
        <div className="-mx-3 mb-6 flex flex-wrap">
          <div className="w-full px-3">
            <Button>Submit</Button>
          </div>
        </div>
      </form>
    </>
  );
};
