'use client';

import { Button } from '~/components/ui/Button';
import useZodForm from '~/hooks/useZodForm';
import { Input } from '~/components/ui/Input';
import { userCreateFormSchema } from './schemas';
import { signup } from '~/actions/auth';

export const SignUpForm = () => {
  const {
    register,
    formState: { errors, isValid },
  } = useZodForm({
    schema: userCreateFormSchema,
    mode: 'all',
  });

  return (
    <form
      className="flex flex-col"
      action={signup}
      autoComplete="do-not-autofill"
    >
      <div className="mb-6 flex flex-wrap">
        <Input
          label="Username"
          hint="Your username should be at least 4 characters, and must not contain any spaces."
          type="text"
          placeholder="username..."
          autoComplete="do-not-autofill"
          error={errors.username?.message}
          {...register('username')}
        />
      </div>
      <div className="mb-6 flex flex-wrap">
        <Input
          label="Password"
          hint="Your password must be at least 8 characters long, and contain at least one each of lowercase, uppercase, number and symbol characters."
          type="password"
          placeholder="******************"
          autoComplete="do-not-autofill"
          error={errors.password?.message}
          {...register('password')}
        />
      </div>
      <div className="flex flex-wrap">
        {/* {isLoading ? (
          <Button disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </Button>
        ) : ( */}
        <Button type="submit" disabled={!isValid}>
          Create account
        </Button>
        {/* )} */}
      </div>
    </form>
  );
};
