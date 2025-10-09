'use client';

import { useRouter } from 'next/navigation';
import { login } from '~/actions/auth';
import { Field, Form, SubmitButton } from '~/lib/form';
import { InputField } from '~/lib/form/components/fields/Input';
import { type FormSubmitHandler } from '~/lib/form/types';
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
    <Form onSubmit={handleSubmit} className="w-full">
      <Field
        key="username"
        name="username"
        label="Username"
        placeholder="Enter your username"
        validation={loginSchema.shape.username}
        Component={InputField}
        autoComplete="username"
      />
      <Field
        key="password"
        name="password"
        label="Password"
        placeholder="Enter your password"
        Component={InputField}
        validation={loginSchema.shape.password}
        type="password"
        autoComplete="current-password"
      />
      <SubmitButton key="submit" className="mt-6" />
    </Form>
  );
};
