import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  AlertCircle,
  Calendar,
  Check,
  DollarSign,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Search,
  User,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { InputField } from './InputField';

const meta: Meta<typeof InputField> = {
  title: 'Components/Fields/InputField',
  component: InputField,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    'size': {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the input field',
      table: {
        type: { summary: 'sm | md | lg' },
        defaultValue: { summary: 'md' },
      },
    },
    'type': {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'url', 'search'],
      description:
        'HTML input type - affects onChange value type (number type returns number, others return string)',
      table: {
        type: {
          summary: 'text | email | password | number | tel | url | search',
        },
        defaultValue: { summary: 'text' },
      },
    },
    'disabled': {
      control: 'boolean',
      description: 'Whether the input is disabled',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    'readOnly': {
      control: 'boolean',
      description: 'Whether the input is read-only',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    'aria-invalid': {
      control: 'boolean',
      description: 'Whether the input has invalid state styling',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    'required': {
      control: 'boolean',
      description: 'Whether the input is required (HTML validation)',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    'placeholder': {
      control: 'text',
      description: 'Placeholder text for the input',
      table: {
        type: { summary: 'string' },
      },
    },
    'prefixComponent': {
      control: false,
      description: 'ReactNode to display before the input (e.g., icons)',
      table: {
        type: { summary: 'ReactNode' },
      },
    },
    'suffixComponent': {
      control: false,
      description:
        'ReactNode to display after the input (e.g., buttons, icons)',
      table: {
        type: { summary: 'ReactNode' },
      },
    },
    'onChange': {
      control: false,
      description:
        'Type-safe change handler - receives number for type="number", string for others',
      table: {
        type: { summary: '(value: number | string) => void' },
      },
    },
  },
  args: {
    placeholder: 'Enter text...',
    type: 'text',
    disabled: false,
    readOnly: false,
    required: false,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    size: 'md',
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
    placeholder: 'Small input',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    placeholder: 'Large input',
  },
};

export const AllSizes: Story = {
  name: 'All Sizes Comparison',
  render: () => (
    <div className="flex w-80 flex-col gap-4">
      <InputField size="sm" placeholder="Small (sm)" />
      <InputField size="md" placeholder="Medium (md) - default" />
      <InputField size="lg" placeholder="Large (lg)" />
    </div>
  ),
};

export const WithValue: Story = {
  args: {
    defaultValue: 'This input has a default value',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: 'Disabled input',
  },
};

export const ReadOnly: Story = {
  args: {
    readOnly: true,
    defaultValue: 'Read-only input',
  },
};

export const Required: Story = {
  args: {
    required: true,
    placeholder: 'Required field',
  },
};

export const EmailType: Story = {
  args: {
    type: 'email',
    placeholder: 'user@example.com',
  },
};

export const PasswordType: Story = {
  args: {
    type: 'password',
    placeholder: 'Enter password',
  },
};

export const NumberType: Story = {
  name: 'Number Type',
  render: () => {
    const [value, setValue] = useState<number | undefined>(42);
    return (
      <div className="w-80 space-y-2">
        <InputField
          type="number"
          placeholder="Enter a number"
          value={value}
          onChange={setValue}
        />
        <p className="text-xs text-current opacity-70">
          Value: {value} (type: {typeof value})
        </p>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Number input with type-safe onChange - returns number (or undefined when cleared)',
      },
    },
  },
};

export const AllInputTypes: Story = {
  name: 'All Input Types',
  render: () => (
    <div className="flex w-80 flex-col gap-3">
      <InputField type="text" placeholder="Text" />
      <InputField type="email" placeholder="email@example.com" />
      <InputField type="password" placeholder="Password" />
      <InputField type="number" placeholder="123" />
      <InputField type="tel" placeholder="+1 (555) 123-4567" />
      <InputField type="url" placeholder="https://example.com" />
      <InputField type="search" placeholder="Search..." />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'All supported input types. Number type returns number on onChange, others return string',
      },
    },
  },
};

export const SearchType: Story = {
  args: {
    type: 'search',
    placeholder: 'Search...',
  },
};

export const Invalid: Story = {
  name: 'Invalid State',
  args: {
    'defaultValue': 'Invalid input',
    'aria-invalid': true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Input with invalid state styling (uses aria-invalid). State priority: disabled > readOnly > invalid > normal',
      },
    },
  },
};

export const AllStates: Story = {
  name: 'All States Comparison',
  render: () => (
    <div className="flex w-80 flex-col gap-4">
      <div>
        <p className="mb-1 text-xs font-medium text-current opacity-70">
          Normal
        </p>
        <InputField placeholder="Normal state" />
      </div>
      <div>
        <p className="mb-1 text-xs font-medium text-current opacity-70">
          Disabled
        </p>
        <InputField disabled defaultValue="Disabled state" />
      </div>
      <div>
        <p className="mb-1 text-xs font-medium text-current opacity-70">
          Read-Only
        </p>
        <InputField readOnly defaultValue="Read-only state" />
      </div>
      <div>
        <p className="mb-1 text-xs font-medium text-current opacity-70">
          Invalid
        </p>
        <InputField aria-invalid defaultValue="Invalid state" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Comparison of all input states. Priority: disabled > readOnly > invalid > normal',
      },
    },
  },
};

export const WithSearchIcon: Story = {
  name: 'With Search Icon',
  args: {
    placeholder: 'Search...',
    prefixComponent: <Search className="h-4 w-4" />,
  },
};

export const WithEmailIcon: Story = {
  name: 'With Email Icon',
  args: {
    type: 'email',
    placeholder: 'user@example.com',
    prefixComponent: <Mail className="h-4 w-4" />,
  },
};

export const WithPasswordToggle: Story = {
  name: 'With Password Toggle',
  render: () => {
    const [showPassword, setShowPassword] = useState(false);
    return (
      <InputField
        type={showPassword ? 'text' : 'password'}
        placeholder="Enter password"
        prefixComponent={<Lock className="h-4 w-4" />}
        suffixComponent={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="hover:text-current"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        }
      />
    );
  },
};

export const WithPriceInput: Story = {
  name: 'Price Input',
  args: {
    type: 'number',
    placeholder: '0.00',
    prefixComponent: <DollarSign className="h-4 w-4" />,
    suffixComponent: <span className="text-sm">USD</span>,
  },
};

export const WithLoadingState: Story = {
  name: 'Loading State',
  args: {
    placeholder: 'Loading...',
    disabled: true,
    suffixComponent: <Loader2 className="h-4 w-4 animate-spin" />,
  },
};

export const WithValidationIcons: Story = {
  name: 'With Validation Icons',
  render: () => (
    <div className="flex flex-col gap-4">
      <InputField
        defaultValue="Valid input"
        suffixComponent={<Check className="h-4 w-4 text-green-500" />}
      />
      <InputField
        defaultValue="Invalid input"
        aria-invalid
        suffixComponent={<AlertCircle className="text-destructive h-4 w-4" />}
      />
    </div>
  ),
};

export const WithClearButton: Story = {
  name: 'With Clear Button',
  render: () => {
    const [value, setValue] = useState('Sample text');
    return (
      <div className="w-80 space-y-2">
        <InputField
          value={value}
          onChange={setValue}
          placeholder="Type something..."
          suffixComponent={
            value && (
              <button
                type="button"
                onClick={() => setValue('')}
                className="hover:text-current"
              >
                <X className="h-4 w-4" />
              </button>
            )
          }
        />
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
          'Input with a clear button in the suffix. Demonstrates type-safe onChange handler',
      },
    },
  },
};

export const WithUserPrefix: Story = {
  name: 'Username Input',
  args: {
    placeholder: 'Enter username',
    prefixComponent: <User className="h-4 w-4" />,
  },
};

export const WithDateIcon: Story = {
  name: 'Date Input',
  args: {
    type: 'date',
    prefixComponent: <Calendar className="h-4 w-4" />,
  },
};

export const SizesWithIcons: Story = {
  name: 'Sizes with Prefix/Suffix',
  render: () => (
    <div className="flex w-80 flex-col gap-4">
      <InputField
        size="sm"
        placeholder="Small with icons"
        prefixComponent={<Search className="h-3 w-3" />}
        suffixComponent={<X className="h-3 w-3" />}
      />
      <InputField
        size="md"
        placeholder="Medium with icons"
        prefixComponent={<Mail className="h-4 w-4" />}
        suffixComponent={<Check className="h-4 w-4 text-green-500" />}
      />
      <InputField
        size="lg"
        placeholder="Large with icons"
        prefixComponent={<User className="h-5 w-5" />}
        suffixComponent={<span className="text-lg font-semibold">PRO</span>}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Input fields at different sizes with both prefix and suffix components. Icon sizes should scale with input size',
      },
    },
  },
};

export const StatesWithIcons: Story = {
  name: 'States with Icons',
  render: () => (
    <div className="flex w-80 flex-col gap-4">
      <InputField
        defaultValue="Normal"
        prefixComponent={<Mail className="h-4 w-4" />}
        suffixComponent={<Check className="h-4 w-4" />}
      />
      <InputField
        disabled
        defaultValue="Disabled"
        prefixComponent={<Mail className="h-4 w-4" />}
        suffixComponent={<Lock className="h-4 w-4" />}
      />
      <InputField
        readOnly
        defaultValue="Read-only"
        prefixComponent={<Mail className="h-4 w-4" />}
      />
      <InputField
        aria-invalid
        defaultValue="Invalid"
        prefixComponent={<Mail className="h-4 w-4" />}
        suffixComponent={<AlertCircle className="text-destructive h-4 w-4" />}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Different input states with prefix/suffix components. Icons inherit state styling',
      },
    },
  },
};

export const TypeSafeOnChange: Story = {
  name: 'Type-Safe onChange Demo',
  render: () => {
    const [textValue, setTextValue] = useState('');
    const [numberValue, setNumberValue] = useState<number | undefined>();

    return (
      <div className="flex w-80 flex-col gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Text Input</label>
          <InputField
            type="text"
            value={textValue}
            onChange={setTextValue}
            placeholder="Type text..."
          />
          <p className="text-xs text-current opacity-70">
            Type: {typeof textValue} | Value: &ldquo;{textValue}&rdquo;
          </p>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Number Input</label>
          <InputField
            type="number"
            value={numberValue}
            onChange={setNumberValue}
            placeholder="Enter number..."
          />
          <p className="text-xs text-current opacity-70">
            Type: {typeof numberValue} | Value: {numberValue ?? 'undefined'}
          </p>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates type-safe onChange handler. Text inputs return string, number inputs return number (or undefined when empty)',
      },
    },
  },
};

export const Playground: Story = {
  args: {
    size: 'md',
    placeholder: 'Playground - try different combinations',
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
