import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import TextAreaField from './TextArea';

const meta: Meta<typeof TextAreaField> = {
  title: 'Systems/Form/Fields/TextAreaField',
  component: TextAreaField,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    'disabled': {
      control: 'boolean',
      description: 'Whether the textarea is disabled',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    'readOnly': {
      control: 'boolean',
      description: 'Whether the textarea is read-only',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    'aria-invalid': {
      control: 'boolean',
      description: 'Whether the textarea has aria-invalid state styling',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    'required': {
      control: 'boolean',
      description: 'Whether the textarea is required (HTML validation)',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    'placeholder': {
      control: 'text',
      description: 'Placeholder text for the textarea',
      table: {
        type: { summary: 'string' },
      },
    },
    'rows': {
      control: 'number',
      description: 'Number of visible text lines',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '4' },
      },
    },
    'maxLength': {
      control: 'number',
      description: 'Maximum number of characters',
      table: {
        type: { summary: 'number' },
      },
    },
    'onChange': {
      control: false,
      description: 'Type-safe change handler - receives value directly',
      table: {
        type: { summary: '(value: string) => void' },
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
  args: {},
};

export const WithValue: Story = {
  args: {
    defaultValue:
      'This textarea has a default value.\n\nIt spans multiple lines to demonstrate how the component handles longer text content.',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: 'Disabled textarea',
  },
};

export const ReadOnly: Story = {
  args: {
    readOnly: true,
    defaultValue: 'Read-only textarea - you cannot edit this text',
  },
};

export const Required: Story = {
  args: {
    required: true,
    placeholder: 'Required field',
  },
};

export const Invalid: Story = {
  name: 'Invalid State',
  args: {
    'defaultValue': 'Invalid textarea content',
    'aria-invalid': true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Textarea with invalid state styling. State priority: disabled > readOnly > invalid > normal',
      },
    },
  },
};

export const AllStates: Story = {
  name: 'All States Comparison',
  render: () => (
    <div className="flex w-full max-w-2xl flex-col gap-4">
      <div>
        <p className="mb-1 text-xs font-medium text-current opacity-70">
          Normal
        </p>
        <TextAreaField placeholder="Normal state" rows={3} />
      </div>
      <div>
        <p className="mb-1 text-xs font-medium text-current opacity-70">
          Disabled
        </p>
        <TextAreaField disabled defaultValue="Disabled state" rows={3} />
      </div>
      <div>
        <p className="mb-1 text-xs font-medium text-current opacity-70">
          Read-Only
        </p>
        <TextAreaField readOnly defaultValue="Read-only state" rows={3} />
      </div>
      <div>
        <p className="mb-1 text-xs font-medium text-current opacity-70">
          Invalid
        </p>
        <TextAreaField aria-invalid defaultValue="Invalid state" rows={3} />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Comparison of all textarea states. Priority: disabled > readOnly > invalid > normal',
      },
    },
  },
};

export const WithMaxLength: Story = {
  render: () => {
    const [value, setValue] = useState('');
    const maxLength = 200;

    return (
      <div className="w-full max-w-md space-y-2">
        <TextAreaField
          value={value}
          onChange={setValue}
          placeholder="Type something... (max 200 characters)"
          maxLength={maxLength}
          rows={4}
        />
        <p className="text-xs text-current opacity-70">
          {value.length} / {maxLength} characters
        </p>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Textarea with character count and maxLength validation. Demonstrates type-safe onChange handler.',
      },
    },
  },
};

export const Resizable: Story = {
  name: 'Resizable Behavior',
  render: () => (
    <div className="w-full max-w-md space-y-4">
      <div>
        <p className="mb-2 text-sm text-current opacity-70">
          The textarea is vertically resizable by default. Try dragging the
          bottom-right corner.
        </p>
        <TextAreaField
          placeholder="Resize me vertically..."
          defaultValue="This textarea can be resized vertically. The resize handle is in the bottom-right corner."
          rows={4}
        />
      </div>
    </div>
  ),
};

export const TypeSafeOnChange: Story = {
  name: 'Type-Safe onChange Demo',
  render: () => {
    const [value, setValue] = useState('');

    return (
      <div className="w-full max-w-md space-y-2">
        <TextAreaField
          value={value}
          onChange={setValue}
          placeholder="Type something..."
          rows={5}
        />
        <p className="text-xs text-current opacity-70">
          Character count: {value.length}
        </p>
        <p className="text-xs text-current opacity-70">
          Word count: {value.trim() ? value.trim().split(/\s+/).length : 0}
        </p>
        <p className="text-xs text-current opacity-70">
          Note: onChange receives the value directly, not the event
        </p>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates type-safe onChange handler that receives the string value directly instead of the event object.',
      },
    },
  },
};

export const Playground: Story = {
  args: {
    placeholder: 'Playground - try different combinations',
    rows: 5,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Use the controls to experiment with different prop combinations',
      },
    },
  },
};
