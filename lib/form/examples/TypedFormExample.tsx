import { z } from 'zod';
import { Field, Form, InputField } from '../components/Form';
import type { ValidationContext } from '../types';

// Define the shape of your additional context
type MyFormContext = {
  maxAge: number;
  allowedDomains: string[];
  userRole: 'admin' | 'user';
};

// Example validation function that uses the typed context
const createAgeValidation = (context: ValidationContext<MyFormContext>) => {
  return z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0, 'Age must be a positive number')
    .refine(
      (val) => val <= (context.additionalContext?.maxAge ?? 100),
      `Age must be less than or equal to ${context.additionalContext?.maxAge ?? 100}`,
    );
};

const createEmailValidation = (context: ValidationContext<MyFormContext>) => {
  const allowedDomains = context.additionalContext?.allowedDomains ?? [
    'example.com',
  ];

  return z
    .string()
    .email('Invalid email format')
    .refine(
      (email) => {
        const domain = email.split('@')[1];
        return domain ? allowedDomains.includes(domain) : false;
      },
      `Email must be from one of these domains: ${allowedDomains.join(', ')}`,
    );
};

export function TypedFormExample() {
  // Define your context data
  const formContext: MyFormContext = {
    maxAge: 65,
    allowedDomains: ['company.com', 'partner.com'],
    userRole: 'admin',
  };

  const handleSubmit = (data: Record<string, unknown>) => {
    // Form submitted successfully with data
    void data;
  };

  return (
    <Form<MyFormContext>
      onSubmit={handleSubmit}
      additionalContext={formContext}
      className="mx-auto max-w-md p-6"
    >
      <h2 className="mb-4 text-2xl font-bold">User Registration</h2>

      <Field<{ meta: { label: string; hint?: string } }, MyFormContext>
        name="name"
        Component={InputField}
        meta={{
          label: 'Full Name',
          hint: 'Enter your full name',
        }}
        validation={z.string().min(2, 'Name must be at least 2 characters')}
      />

      <Field<{ meta: { label: string; hint?: string } }, MyFormContext>
        name="age"
        Component={InputField}
        meta={{
          label: 'Age',
          hint: `Must be between 1 and ${formContext.maxAge}`,
        }}
        validation={createAgeValidation}
      />

      <Field<{ meta: { label: string; hint?: string } }, MyFormContext>
        name="email"
        Component={InputField}
        meta={{
          label: 'Email',
          hint: `Must use one of: ${formContext.allowedDomains.join(', ')}`,
        }}
        validation={createEmailValidation}
      />

      {/* Conditional field based on user role */}
      {formContext.userRole === 'admin' && (
        <Field<{ meta: { label: string } }, MyFormContext>
          name="adminCode"
          Component={InputField}
          meta={{
            label: 'Admin Code',
          }}
          validation={z
            .string()
            .length(6, 'Admin code must be exactly 6 characters')}
        />
      )}

      <button
        type="submit"
        className="w-full rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
      >
        Register
      </button>
    </Form>
  );
}
