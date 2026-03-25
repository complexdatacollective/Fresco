import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { expect, screen, userEvent, waitFor } from 'storybook/test';
import CheckboxGroupField from '~/lib/form/components/fields/CheckboxGroup';

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
