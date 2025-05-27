'use client';

import { useForm } from '@tanstack/react-form';

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
      await new Promise((resolve) => setTimeout(resolve, 2000));
      alert(`Form submitted with values: ${JSON.stringify(value, null, 2)}`);
    },
  });

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
            </div>
          )}
        />

        <div className="border-t pt-4">
          <h3 className="text-md">Nested Form</h3>

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

      <div className="pt-4">
        <form.Subscribe
          selector={(state) => ({
            signature: state.values.consent.signature,
            age: state.values.consent.age,
          })}
          children={({ signature, age }) => (
            <div className="flex flex-col gap-2">
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

      <form.Subscribe
        selector={(state) => ({
          isSubmitting: state.isSubmitting,
          values: state.values,
        })}
        children={({ isSubmitting, values }) => {
          const isDisabled =
            !values.name || !values.consent.signature || !values.consent.age;

          return (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                form.handleSubmit();
              }}
              disabled={isDisabled}
              className={`w-full rounded p-2 ${
                isDisabled ? 'bg-muted cursor-not-allowed' : 'bg-accent'
              }`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Form'}
            </button>
          );
        }}
      />
    </div>
  );
};

export default FormTest;
