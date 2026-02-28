import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import PasswordField from './PasswordField';

const meta: Meta<typeof PasswordField> = {
  title: 'Setup/PasswordField',
  component: PasswordField,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <div className="w-80">
        <PasswordField value={value} onChange={setValue} />
      </div>
    );
  },
};

export const WithStrengthMeter: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <div className="w-80">
        <PasswordField value={value} onChange={setValue} showStrengthMeter />
      </div>
    );
  },
};

export const StrengthLevels: Story = {
  render: () => {
    const passwords = [
      { label: 'Weak', value: 'abc' },
      { label: 'Fair', value: 'abcdefg1' },
      { label: 'Good', value: 'abcdeG1!' },
      { label: 'Strong', value: 'abcdefG1!xyz' },
    ];

    return (
      <div className="flex w-80 flex-col gap-6">
        {passwords.map(({ label, value }) => (
          <div key={label} className="flex flex-col gap-1">
            <span className="text-sm font-medium">{label}</span>
            <PasswordField
              value={value}
              onChange={() => {}}
              showStrengthMeter
            />
          </div>
        ))}
      </div>
    );
  },
};
