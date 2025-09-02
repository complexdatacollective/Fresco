import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { TextAreaField } from './TextArea';

const meta: Meta<typeof TextAreaField> = {
  title: 'Components/Fields/TextAreaField',
  component: TextAreaField,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    disabled: {
      control: 'boolean',
      description: 'Whether the textarea is disabled',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    readOnly: {
      control: 'boolean',
      description: 'Whether the textarea is read-only',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    required: {
      control: 'boolean',
      description: 'Whether the textarea is required',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text for the textarea',
      table: {
        type: { summary: 'string' },
      },
    },
    defaultValue: {
      control: 'text',
      description: 'Default value of the textarea',
      table: {
        type: { summary: 'string' },
      },
    },
    rows: {
      control: 'number',
      description: 'Number of visible text lines',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '4' },
      },
    },
    cols: {
      control: 'number',
      description: 'Visible width of the text control',
      table: {
        type: { summary: 'number' },
      },
    },
    maxLength: {
      control: 'number',
      description: 'Maximum number of characters',
      table: {
        type: { summary: 'number' },
      },
    },
  },
  args: {
    placeholder: 'Enter your text...',
    disabled: false,
    readOnly: false,
    required: false,
    rows: 4,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState('');

    return (
      <div className="w-full max-w-md">
        <TextAreaField
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Type something..."
          rows={4}
        />
      </div>
    );
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: 'Disabled textarea',
  },
};
