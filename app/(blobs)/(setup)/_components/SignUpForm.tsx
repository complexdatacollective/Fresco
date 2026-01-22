'use client';

import { useRouter } from 'next/navigation';
import { signup } from '~/actions/auth';
import Field from '~/lib/form/components/Field/Field';
import FieldGroup from '~/lib/form/components/FieldGroup';
import InputField from '~/lib/form/components/fields/InputField';
import Form from '~/lib/form/components/Form';
import SubmitButton from '~/lib/form/components/SubmitButton';
import { type FormSubmitHandler } from '~/lib/form/store/types';
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
        custom={{
          schema: createUserSchema.shape.username,
          hint: 'At least 4 characters, no spaces',
        }}
        component={InputField}
        autoComplete="do-not-autofill"
      />
      <Field
        key="password"
        name="password"
        label="Password"
        placeholder="******************"
        hint="Your password must be at least 8 characters long, and contain at least one each of lowercase, uppercase, number and symbol characters."
        custom={{
          schema: createUserSchema.shape.password,
          hint: 'At least 8 characters with lowercase, uppercase, number and symbol',
        }}
        component={InputField}
        type="password"
        autoComplete="do-not-autofill"
      />
      <FieldGroup
        watch={['password']}
        condition={(values) => !!values.password}
      >
        <Field
          key="confirmPassword"
          name="confirmPassword"
          label="Confirm password"
          placeholder="******************"
          sameAs="password"
          component={InputField}
          type="password"
          autoComplete="do-not-autofill"
        />
      </FieldGroup>
      <SubmitButton key="submit" className="mt-6">
        Create account
      </SubmitButton>
    </Form>
  );
};
