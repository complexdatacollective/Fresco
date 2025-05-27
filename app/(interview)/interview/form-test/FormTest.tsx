'use client';

import { useForm, useStore, type AnyFieldApi } from '@tanstack/react-form';
import { z } from 'zod';
import { Button } from '~/lib/ui/components';

const FormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  consent: z.object({
    signature: z.string(),
    age: z.string(),
  }),
});

type ToggleChoiceOption = {
  value: string;
  label: string;
};

type ToggleChoiceProps = {
  value: string;
  onChange: (value: string) => void;
  label: string;
  options: ToggleChoiceOption[];
};

// placeholder for actual component demonstrating custom input controls
const ToggleChoice = ({
  value,
  onChange,
  label,
  options,
}: ToggleChoiceProps) => {
  return (
    <div className="flex items-center gap-2">
      <label>{label}</label>
      <div className="flex gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded border px-3 py-1 text-xs hover:font-bold ${
              value === option.value ? 'bg-accent' : 'border'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};
const FieldInfo = ({ field }: { field: AnyFieldApi }) => {
  return (
    <>
      {field.state.meta.isTouched && !field.state.meta.isValid ? (
        <div className="text-destructive">
          {field.state.meta.errors.map((err) => err.message).join(',')}
        </div>
      ) : null}
      {field.state.meta.isValidating ? 'Validating...' : null}
    </>
  );
};

const FormTest = () => {
  const form = useForm({
    defaultValues: {
      name: '',
      consent: {
        signature: '',
        age: '',
      },
    },
    onSubmit: async ({ value }) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert(`Form submitted with values: ${JSON.stringify(value, null, 2)}`);
    },
    validators: {
      onChange: FormSchema,
    },
  });

  const validationErrors = useStore(form.store, (state) => state.errorMap);

  return (
    <div className="max-w-md border-2 border-white p-6">
      <h2 className="text-xl">Simple Form</h2>

      <div>
        <form.Field
          name="name"
          children={(field) => (
            <div>
              <label className="text-sm">Name</label>
              <input
                type="text"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                className="text-primary w-full border"
                placeholder="Enter your name"
              />
              <FieldInfo field={field} />
            </div>
          )}
        />

        <div className="border-t pt-4">
          <h3>Nested Form</h3>

          <form.Field
            name="consent.signature"
            children={(field) => (
              <div className="mb-3">
                <ToggleChoice
                  value={field.state.value}
                  onChange={field.handleChange}
                  label="Signed consent?"
                  options={[
                    { value: 'yes', label: 'Yes' },
                    { value: 'no', label: 'No' },
                  ]}
                />
              </div>
            )}
          />
          <form.Field
            name="consent.age"
            children={(field) => (
              <div className="mb-3">
                <ToggleChoice
                  value={field.state.value}
                  onChange={field.handleChange}
                  label="Age verification:"
                  options={[
                    { value: 'under-18', label: 'Under 18' },
                    { value: 'over-18', label: '18+' },
                    { value: 'refuse', label: 'Refuse to answer' },
                  ]}
                />
              </div>
            )}
          />
        </div>
      </div>

      <form.Subscribe
        selector={(state) => ({
          isSubmitting: state.isSubmitting,
          values: state.values,
          canSubmit: state.canSubmit,
        })}
      >
        {({ isSubmitting, canSubmit }) => (
          <Button
            type="submit"
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.preventDefault();
              form.handleSubmit();
            }}
            disabled={!canSubmit}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Form'}
          </Button>
        )}
      </form.Subscribe>
      <div className="py-4">
        <form.Subscribe
          selector={(state) => ({
            signature: state.values.consent.signature,
            age: state.values.consent.age,
          })}
          children={({ signature, age }) => (
            <div className="flex flex-col gap-2">
              Components reactive to form state values. Not connected to zod
              validation:
              {signature === 'yes' && age === 'over-18' && (
                <div className="border-success rounded border-2 p-4">
                  ✅ All consent requirements met
                </div>
              )}
              {signature === 'no' && (
                <div className="border-warning rounded border-2 p-4">
                  ✏️ Signature required for consent.
                </div>
              )}
              {(age === 'under-18' || age === 'refuse') && (
                <div className="border-destructive rounded border-2 p-4">
                  🔞 You must be 18+ to participate.
                </div>
              )}
            </div>
          )}
        />
      </div>
      <form.Subscribe
        selector={(state) => state.values}
        children={(values) => (
          <div className="pt-4">
            <div>Current values (reactive with form.Subscribe):</div>
            <pre>{JSON.stringify(values, null, 2)}</pre>
          </div>
        )}
      />

      <>
        <div className="pt-4">
          <div>Validation errors (reactive with useStore hook):</div>
          <pre>{JSON.stringify(validationErrors.onChange, null, 2)}</pre>
        </div>
      </>
    </div>
  );
};

export default FormTest;
