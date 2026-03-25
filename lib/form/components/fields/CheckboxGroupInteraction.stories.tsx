import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useEffect, useRef, useState } from 'react';
import { expect, screen, userEvent, waitFor, within } from 'storybook/test';
import Surface from '~/components/layout/Surface';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';
import Field from '~/lib/form/components/Field/Field';
import CheckboxGroupField from '~/lib/form/components/fields/CheckboxGroup';
import InputField from '~/lib/form/components/fields/InputField';
import RadioGroupField from '~/lib/form/components/fields/RadioGroup';
import useFormStore from '~/lib/form/hooks/useFormStore';
import FormStoreProvider from '~/lib/form/store/formStoreProvider';

// ---- Simple controlled test ----

function ControlledCheckboxGroup() {
  const [values, setValues] = useState<(string | number)[]>(['a', 'b', 'c']);

  return (
    <div>
      <CheckboxGroupField
        id="test"
        name="test"
        options={[
          { value: 'a', label: 'Option A' },
          { value: 'b', label: 'Option B' },
          { value: 'c', label: 'Option C' },
        ]}
        value={values}
        onChange={setValues}
      />
      <div data-testid="result">{JSON.stringify(values)}</div>
    </div>
  );
}

// ---- Wizard step reproduction ----
// Mimics the SiblingsDetailStep exactly: FormStoreProvider, ego-parents
// checkbox group, sibling name + sex fields, sibling shared-parents checkbox group

const PARENTS = [
  { name: 'Mom', value: '0' },
  { name: 'Donor 1', value: '1' },
  { name: 'Donor 2', value: '2' },
];

const SEX_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

function WizardStepReproduction() {
  return (
    <FormStoreProvider>
      <WizardStepInner />
    </FormStoreProvider>
  );
}

function WizardStepInner() {
  const validateForm = useFormStore((s) => s.validateForm);
  const getFormValues = useFormStore((s) => s.getFormValues);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const getFormValuesRef = useRef(getFormValues);
  getFormValuesRef.current = getFormValues;

  const handleSubmit = async () => {
    const isValid = await validateForm();
    if (!isValid) return;

    const values = getFormValuesRef.current();
    const rawEgoParents = values['ego-parents'];
    const egoParentIndices = Array.isArray(rawEgoParents)
      ? rawEgoParents.map((v) => Number(v))
      : [0, 1, 2];

    const rawSharedParents = values['sibling-0-sharedParents'];
    const sharedParentIndices = Array.isArray(rawSharedParents)
      ? rawSharedParents.map((v) => Number(v))
      : [];

    setSubmitted(JSON.stringify({ egoParentIndices, sharedParentIndices }));
  };

  return (
    <div className="flex flex-col gap-6 p-4">
      <Surface level={1} spacing="sm">
        <Paragraph>
          Since you have multiple parents, please confirm which are specifically
          your parents.
        </Paragraph>
        <Field
          name="ego-parents"
          label="Which of these parents are YOUR parents?"
          data-testid="ego-parents-checkboxes"
          component={CheckboxGroupField}
          options={PARENTS.map((p) => ({ value: p.value, label: p.name }))}
          initialValue={PARENTS.map((p) => p.value)}
        />
      </Surface>

      <div className="flex flex-col gap-3 rounded border p-4">
        <Heading level="h3">Sibling 1</Heading>
        <Field
          name="sibling-0-name"
          label="Name"
          component={InputField}
          placeholder="Enter name"
          required
        />
        <Field
          name="sibling-0-sex"
          label="Sex assigned at birth"
          component={RadioGroupField}
          options={SEX_OPTIONS}
          required
        />
        <Field
          name="sibling-0-sharedParents"
          label="Which of your parents are also this sibling's parent?"
          component={CheckboxGroupField}
          options={PARENTS.map((p) => ({ value: p.value, label: p.name }))}
          initialValue={PARENTS.map((p) => p.value)}
        />
      </div>

      <button onClick={() => void handleSubmit()}>Submit</button>

      {submitted && <div data-testid="wizard-result">{submitted}</div>}
    </div>
  );
}

// ---- Meta ----

const meta: Meta = {
  title: 'Form/Fields/CheckboxGroup Interaction',
  component: ControlledCheckboxGroup,
};

export default meta;
type Story = StoryObj;

// ---- Stories ----

export const ClickCheckbox: Story = {
  play: async () => {
    const checkboxC = await screen.findByRole('checkbox', {
      name: 'Option C',
    });
    await expect(checkboxC).toHaveAttribute('aria-checked', 'true');

    await userEvent.click(checkboxC);

    await waitFor(async () => {
      await expect(checkboxC).toHaveAttribute('aria-checked', 'false');
    });

    await waitFor(async () => {
      await expect(screen.getByTestId('result')).toHaveTextContent('["a","b"]');
    });
  },
};

export const ClickLabel: Story = {
  play: async () => {
    const labelText = await screen.findByText('Option C');
    await expect(
      screen.getByRole('checkbox', { name: 'Option C' }),
    ).toHaveAttribute('aria-checked', 'true');

    await userEvent.click(labelText);

    await waitFor(async () => {
      await expect(
        screen.getByRole('checkbox', { name: 'Option C' }),
      ).toHaveAttribute('aria-checked', 'false');
    });

    await waitFor(async () => {
      await expect(screen.getByTestId('result')).toHaveTextContent('["a","b"]');
    });
  },
};

export const WizardStepRepro: Story = {
  render: () => <WizardStepReproduction />,
  play: async () => {
    // 1. Uncheck Donor 2 from ego's parents
    const egoContainer = await screen.findByTestId('ego-parents-checkboxes');
    const egoScope = within(egoContainer);
    const donor2Cb = await egoScope.findByRole('checkbox', {
      name: 'Donor 2',
    });
    await expect(donor2Cb).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(donor2Cb);
    await waitFor(async () => {
      await expect(donor2Cb).toHaveAttribute('aria-checked', 'false');
    });

    // 2. Fill sibling name + sex
    const nameInput = await screen.findByRole('textbox');
    await userEvent.click(nameInput);
    await userEvent.type(nameInput, 'Half Sib');
    await userEvent.click(await screen.findByRole('radio', { name: 'Female' }));

    // 3. Uncheck Donor 1 from sibling's shared parents
    const donor1Cbs = await screen.findAllByRole('checkbox', {
      name: 'Donor 1',
    });
    // Index 0 = ego group, index 1 = sibling group
    await userEvent.click(donor1Cbs[1]!);
    await waitFor(async () => {
      await expect(donor1Cbs[1]).toHaveAttribute('aria-checked', 'false');
    });

    // 4. Submit and verify
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(async () => {
      const result = screen.getByTestId('wizard-result');
      const data = JSON.parse(result.textContent!);
      await expect(data.egoParentIndices).toEqual([0, 1]);
      await expect(data.sharedParentIndices).toEqual([0, 2]);
    });
  },
};
