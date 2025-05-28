'use client';

import {
  formOptions,
  mergeForm,
  useForm,
  useStore,
  useTransform,
} from '@tanstack/react-form';
import { initialFormState } from '@tanstack/react-form/nextjs';
import { useFormState } from 'react-dom';
import { z } from 'zod';
import { Button } from '~/lib/ui/components';
import {
  RadioGroup,
  Text,
  ToggleButtonGroup,
} from '~/lib/ui/components/Fields';
import updateData from './action';

const FormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  communicationPrefs: z.object({
    methods: z
      .array(z.string())
      .min(1, 'Please select at least one communication method'),
    frequency: z.string().min(1, 'Please select a frequency option'),
  }),
});

export const formOpts = formOptions({
  defaultValues: {
    name: '',
    communicationPrefs: {
      methods: [],
      frequency: '',
    },
  },
});

const FormTest = () => {
  const [state, action] = useFormState(updateData, initialFormState);

  const form = useForm({
    ...formOpts,
    transform: useTransform(
      (baseForm) => mergeForm(baseForm, state ?? {}),
      [state],
    ),
    validators: {
      onChange: FormSchema,
    },
  });

  const validationErrors = useStore(form.store, (state) => state.errorMap);
  const serverErrors = state.errors || [];

  return (
    <div className="border-2 border-white p-6">
      <h2 className="pb-2 text-xl">Simple Form</h2>

      <form action={action as never} onSubmit={() => form.handleSubmit()}>
        {serverErrors.map((error) => (
          <div className="text-destructive">
            <p>{JSON.stringify(error)}</p>
          </div>
        ))}

        <form.Field
          name="name"
          children={(field) => (
            <div>
              <Text
                input={{
                  name: field.name,
                  value: field.state.value,
                  onChange: (e) => field.handleChange(e.target.value),
                }}
                placeholder="Enter your name"
              />
            </div>
          )}
        />

        <div className="border-t pt-4">
          <h3>Nested fields</h3>

          <form.Field
            name="communicationPrefs.methods"
            children={(field) => {
              return (
                <div className="mb-3">
                  <ToggleButtonGroup
                    input={{
                      name: field.name,
                      value: Array.isArray(field.state.value)
                        ? field.state.value
                        : [],
                      onChange: field.handleChange,
                    }}
                    meta={{
                      error: field.state.meta.errors?.[0]?.message,
                      invalid: !field.state.meta.isValid,
                      touched: field.state.meta.isTouched,
                    }}
                    options={[
                      { value: 'phone', label: 'Phone' },
                      { value: 'text', label: 'Text' },
                      { value: 'email', label: 'Email' },
                    ]}
                    label="Preferred Communication Methods:"
                  />
                </div>
              );
            }}
          />

          <form.Field
            name="communicationPrefs.frequency"
            children={(field) => {
              return (
                <div className="mb-3">
                  <RadioGroup
                    input={{
                      name: field.name,
                      value: field.state.value,
                      onChange: (value) => {
                        console.log('RadioGroup onChange received:', value);
                        field.handleChange(value);
                      },
                    }}
                    meta={{
                      error: field.state.meta.errors?.[0]?.message,
                      invalid: !field.state.meta.isValid,
                      touched: field.state.meta.isTouched,
                    }}
                    options={[
                      { value: 'daily', label: 'Daily' },
                      { value: 'weekly', label: 'Weekly' },
                      { value: 'monthly', label: 'Monthly' },
                    ]}
                    label="Communication Frequency:"
                  />
                </div>
              );
            }}
          />
        </div>

        <form.Subscribe
          selector={(state) => ({
            isSubmitting: state.isSubmitting,
            values: state.values,
            canSubmit: state.canSubmit,
          })}
        >
          {({ isSubmitting, canSubmit }) => (
            <Button type="submit" disabled={!canSubmit}>
              {isSubmitting ? 'Submitting...' : 'Submit Form'}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <h1>Reactivity demo:</h1>
      <div className="py-4">
        <form.Subscribe
          selector={(state) => ({
            methods: state.values.communicationPrefs.methods,
            frequency: state.values.communicationPrefs.frequency,
          })}
          children={({ methods, frequency }) => (
            <div className="flex flex-col gap-2">
              <div>
                <strong>Preferred methods:</strong>{' '}
                {methods.join(', ') || 'None'}
              </div>
              <div>
                <strong>Contact frequency:</strong> {frequency || 'None'}
              </div>
            </div>
          )}
        />
      </div>

      <div className="pt-4">
        <div>Client validation errors (reactive with useStore hook):</div>
        <pre>{JSON.stringify(validationErrors.onChange, null, 2)}</pre>
      </div>

      <div className="pt-4">
        <div>Current form values:</div>
        <pre>{JSON.stringify(form.state.values, null, 2)}</pre>
      </div>
    </div>
  );
};

export default FormTest;
