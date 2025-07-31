import React from 'react';
import { Form, Field, InputField } from './components/Form';
import { z } from 'zod';

export function TestForm() {
  const handleSubmit = (data: Record<string, unknown>) => {
    // eslint-disable-next-line no-console
    console.log('Test form submitted:', data);
  };

  return (
    <Form name="test-form" onSubmit={handleSubmit}>
      <Field
        name="name"
        label="Name"
        placeholder="Enter your name"
        Component={InputField}
        validation={z.string().min(2, 'Name must be at least 2 characters')}
      />

      <Field
        name="email"
        label="Email"
        placeholder="Enter your email"
        Component={InputField}
        validation={z.string().email('Please enter a valid email')}
      />

      <button type="submit">Submit</button>
    </Form>
  );
}
