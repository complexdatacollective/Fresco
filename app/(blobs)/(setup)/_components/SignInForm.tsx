'use client';

import { User2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { login } from '~/actions/auth';
import { DialogFooter } from '~/lib/dialogs/Dialog';
import { Field, Form, SubmitButton } from '~/lib/form';
import { InputField } from '~/lib/form/components/fields/InputField';
import PasswordField from '~/lib/form/components/fields/PasswordField';
import { type FormSubmitHandler } from '~/lib/form/components/types';
import { loginSchema } from '~/schemas/auth';

export const SignInForm = () => {
  const router = useRouter();

  const handleSubmit: FormSubmitHandler = async (data) => {
    const result = await login(data);

    if (result.success === true) {
      router.push('/dashboard');
      return result;
    }

    return result;
  };

  return (
    <Form onSubmit={handleSubmit} className="w-full min-w-sm">
      <Field
        key="username"
        name="username"
        label="Username"
        placeholder="Enter your username"
        validation={loginSchema.shape.username}
        Component={InputField}
        autoComplete="username"
        prefixComponent={<User2 className="h-4 w-4" />}
      />
      <Field
        key="password"
        name="password"
        label="Password"
        placeholder="Enter your password"
        Component={PasswordField}
        validation={loginSchema.shape.password}
        autoComplete="current-password"
      />
      <DialogFooter>
        <SubmitButton key="submit" submittingText="Signing in...">
          Sign In
        </SubmitButton>
      </DialogFooter>
    </Form>
  );
};
