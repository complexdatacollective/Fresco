'use client';

import { Loader2 } from 'lucide-react';
import { signup } from '~/actions/auth';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import useZodForm from '~/hooks/useZodForm';
import { createUserSchema } from '~/schemas/auth';

export const SignUpForm = () => {
  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors, isValid, isSubmitting },
  } = useZodForm({
    schema: createUserSchema,
    mode: 'onTouched',
  });

  const onSubmit = async (data: unknown) => {
    await signup(data);
  };

  const password = watch('password');

  return (
    <form
      className="flex flex-col"
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
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
          {...register('username', {})}
        />
      </div>
      <div className="mb-6 flex flex-wrap">
        <Input
          className="w-full"
          label="Password"
          hint="Your password must be at least 8 characters long, and contain at least one each of lowercase, uppercase, number and symbol characters."
          type="password"
          placeholder="******************"
          autoComplete="do-not-autofill"
          error={errors.password?.message}
          {...register('password', {
            onChange: () => trigger('password'),
          })}
        />
        {password && password.length > 0 && (
          <Input
            className="w-full"
            label="Confirm password"
            type="password"
            placeholder="******************"
            autoComplete="do-not-autofill"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword', {
              onChange: () => trigger('confirmPassword'),
            })}
          />
        )}
      </div>
      <div className="flex flex-wrap justify-end">
        <Button disabled={isSubmitting || !isValid} type="submit">
          {isSubmitting && <Loader2 className="mr-2 animate-spin" />}
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </Button>
      </div>
    </form>
  );
};
