import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { expect, screen, userEvent, waitFor } from 'storybook/test';
import Field from '~/lib/form/components/Field/Field';
import CheckboxGroupField from '~/lib/form/components/fields/CheckboxGroup';
import useFormStore from '~/lib/form/hooks/useFormStore';
import FormStoreProvider from '~/lib/form/store/formStoreProvider';

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

const meta: Meta = {
  title: 'Form/Fields/CheckboxGroup Interaction',
  component: ControlledCheckboxGroup,
};

export default meta;
type Story = StoryObj;

export const ClickCheckbox: Story = {
  play: async () => {
    // Find checkbox C and verify it starts checked
    const checkboxC = await screen.findByRole('checkbox', { name: 'Option C' });
    await expect(checkboxC).toHaveAttribute('aria-checked', 'true');

    // Click to uncheck
    await userEvent.click(checkboxC);

    // Verify it unchecked
    await waitFor(async () => {
      await expect(checkboxC).toHaveAttribute('aria-checked', 'false');
    });

    await waitFor(async () => {
      await expect(screen.getByTestId('result')).toHaveTextContent('["a","b"]');
    });
  },
};

function FormFieldCheckboxGroup() {
  return (
    <FormStoreProvider>
      <FormFieldInner />
    </FormStoreProvider>
  );
}

function FormFieldInner() {
  const getFormValues = useFormStore((s) => s.getFormValues);
  const values = getFormValues();

  return (
    <div>
      <Field
        name="choices"
        label="Pick options"
        component={CheckboxGroupField}
        options={[
          { value: 'a', label: 'Option A' },
          { value: 'b', label: 'Option B' },
          { value: 'c', label: 'Option C' },
        ]}
        initialValue={['a', 'b', 'c']}
      />
      <div data-testid="form-result">
        {JSON.stringify(values.choices ?? 'undefined')}
      </div>
    </div>
  );
}

export const ClickCheckboxInFormField: Story = {
  render: () => <FormFieldCheckboxGroup />,
  play: async () => {
    const checkboxC = await screen.findByRole('checkbox', { name: 'Option C' });
    await expect(checkboxC).toHaveAttribute('aria-checked', 'true');

    await userEvent.click(checkboxC);

    await waitFor(async () => {
      await expect(checkboxC).toHaveAttribute('aria-checked', 'false');
    });

    await waitFor(async () => {
      await expect(screen.getByTestId('form-result')).toHaveTextContent(
        '["a","b"]',
      );
    });
  },
};

function DialogCheckboxGroup() {
  const [open, setOpen] = useState(true);

  return (
    <div>
      <button onClick={() => setOpen(true)}>Open</button>
      {open && (
        <dialog open style={{ position: 'fixed', zIndex: 1000 }}>
          <FormStoreProvider>
            <DialogCheckboxInner onClose={() => setOpen(false)} />
          </FormStoreProvider>
        </dialog>
      )}
    </div>
  );
}

function DialogCheckboxInner({ onClose }: { onClose: () => void }) {
  return (
    <div>
      <Field
        name="choices"
        label="Pick options"
        data-testid="dialog-checkboxes"
        component={CheckboxGroupField}
        options={[
          { value: 'a', label: 'Option A' },
          { value: 'b', label: 'Option B' },
          { value: 'c', label: 'Option C' },
        ]}
        initialValue={['a', 'b', 'c']}
      />
      <button onClick={onClose}>Close</button>
    </div>
  );
}

export const ClickCheckboxInDialog: Story = {
  render: () => <DialogCheckboxGroup />,
  play: async () => {
    const checkboxC = await screen.findByRole('checkbox', { name: 'Option C' });
    await expect(checkboxC).toHaveAttribute('aria-checked', 'true');

    await userEvent.click(checkboxC);

    await waitFor(async () => {
      await expect(checkboxC).toHaveAttribute('aria-checked', 'false');
    });
  },
};

export const ClickLabel: Story = {
  play: async () => {
    // Find the text label and click it instead of the checkbox button
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
