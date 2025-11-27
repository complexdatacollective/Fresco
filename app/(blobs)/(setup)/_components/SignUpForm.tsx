'use client';

import { useRouter } from 'next/navigation';
import { signup } from '~/actions/auth';
import { Field, Form, SubmitButton, useFormValue } from '~/lib/form';
import { InputField } from '~/lib/form/components/fields/InputField';
import { type FormSubmitHandler } from '~/lib/form/types';
import { createUserSchema } from '~/schemas/auth';

export const SignUpForm = () => {
  const router = useRouter();

  const handleSubmit: FormSubmitHandler = async (data) => {
    const result = await signup(data);

    if (result.success === true) {
      router.push('/dashboard');
      return {
        success: true,
      };
    }

    return {
      success: false,
      errors: {
        form: result.error ? [result.error] : [],
      },
    };
  };

  return (
    <Form onSubmit={handleSubmit} className="flex flex-col">
      <Field
        key="username"
        name="username"
        label="Username"
        placeholder="username..."
        hint="Your username should be at least 4 characters, and must not contain any spaces."
        validation={createUserSchema.shape.username}
        Component={InputField}
        autoComplete="do-not-autofill"
      />
      <Field
        key="password"
        name="password"
        label="Password"
        placeholder="******************"
        hint="Your password must be at least 8 characters long, and contain at least one each of lowercase, uppercase, number and symbol characters."
        validation={createUserSchema.shape.password}
        Component={InputField}
        type="password"
        autoComplete="do-not-autofill"
      />
      <PasswordConfirmField />
      <SubmitButton key="submit" className="mt-6">
        Create account
      </SubmitButton>
    </Form>
  );
};

// Separate component to handle conditional rendering based on password value
function PasswordConfirmField() {
  const { password } = useFormValue(['password']);

  if (!password || password === '') {
    return null;
  }

  return (
    <Field
      key="confirmPassword"
      name="confirmPassword"
      label="Confirm password"
      placeholder="******************"
      validation={createUserSchema.shape.confirmPassword}
      Component={InputField}
      type="password"
      autoComplete="do-not-autofill"
    />
  );
}
