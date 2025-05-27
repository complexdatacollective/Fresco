'use client';

import {
  formOptions,
  mergeForm,
  useForm,
  useStore,
  useTransform,
  type AnyFieldApi,
} from '@tanstack/react-form';
import { initialFormState } from '@tanstack/react-form/nextjs';
import { useFormState } from 'react-dom';
import { z } from 'zod';
import { Button } from '~/lib/ui/components';
import updateData from './action';

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
  name: string;
};

export const formOpts = formOptions({
  defaultValues: {
    name: '',
    consent: {
      signature: '',
      age: '',
    },
  },
});

// placeholder for actual component demonstrating custom input controls
const ToggleChoice = ({
  name,
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
      <input type="hidden" name={name} value={value} />
    </div>
  );
};
const FieldInfo = ({ field }: { field: AnyFieldApi }) => {
  return (
    <>
      {field.state.meta.isTouched && !field.state.meta.isValid ? (
        <div className="text-destructive">
          Client validation:{' '}
          {field.state.meta.errors.map((err) => err.message).join(',')}
        </div>
      ) : null}
      {field.state.meta.isValidating ? 'Validating...' : null}
    </>
  );
};

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
    <div className="max-w-md border-2 border-white p-6">
      <h2 className="text-xl">Simple Form</h2>

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
                  name="consent.signature"
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
                  name="consent.age"
                />
              </div>
            )}
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
      <h1> Reactivity demo:</h1>

      <div className="py-4">
        <form.Subscribe
          selector={(state) => ({
            signature: state.values.consent.signature,
            age: state.values.consent.age,
          })}
          children={({ signature, age }) => (
            <div className="flex flex-col gap-2">
              Components reactive to form state values (form.Subscribe). Not
              related to client validation
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

      <>
        <div className="pt-4">
          <div>Client validation errors (reactive with useStore hook):</div>
          <pre>{JSON.stringify(validationErrors.onChange, null, 2)}</pre>
        </div>
      </>
    </div>
  );
};

export default FormTest;
