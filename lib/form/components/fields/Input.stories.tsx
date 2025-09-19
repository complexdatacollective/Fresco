import type { Meta, StoryObj } from '@storybook/react';
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
import { InputField } from './Input';

const meta: Meta<typeof InputField> = {
  title: 'Components/Fields/InputField',
  component: InputField,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the input field',
      table: {
        type: { summary: 'sm | md | lg' },
        defaultValue: { summary: 'md' },
      },
    },
    variant: {
      control: 'select',
      options: ['default', 'ghost', 'filled', 'outline'],
      description: 'Visual variant of the input field',
      table: {
        type: { summary: 'default | ghost | filled | outline' },
        defaultValue: { summary: 'default' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the input is disabled',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    readOnly: {
      control: 'boolean',
      description: 'Whether the input is read-only',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    required: {
      control: 'boolean',
      description: 'Whether the input is required',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'url', 'search'],
      description: 'HTML input type',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'text' },
      },
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text for the input',
      table: {
        type: { summary: 'string' },
      },
    },
    defaultValue: {
      control: 'text',
      description: 'Default value of the input',
      table: {
        type: { summary: 'string' },
      },
    },
    prefixComponent: {
      control: false,
      description: 'Content to display before the input',
      table: {
        type: { summary: 'ReactNode' },
      },
    },
    suffixComponent: {
      control: false,
      description: 'Content to display after the input',
      table: {
        type: { summary: 'ReactNode' },
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
    variant: 'default',
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

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    placeholder: 'Ghost variant',
  },
};

export const Filled: Story = {
  args: {
    variant: 'filled',
    placeholder: 'Filled variant',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    placeholder: 'Outline variant',
  },
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
  args: {
    type: 'number',
    placeholder: 'Enter a number',
  },
};

export const SearchType: Story = {
  args: {
    type: 'search',
    placeholder: 'Search...',
  },
};

export const LargeGhost: Story = {
  name: 'Large Ghost Variant',
  args: {
    size: 'lg',
    variant: 'ghost',
    placeholder: 'Combined variants',
  },
};

export const SmallFilled: Story = {
  name: 'Small Filled Variant',
  args: {
    size: 'sm',
    variant: 'filled',
    placeholder: 'Compact filled input',
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
        story: 'Input with invalid state styling (uses aria-invalid)',
      },
    },
  },
};

export const DisabledVariants: Story = {
  name: 'Disabled States (All Variants)',
  render: () => (
    <div className="flex flex-col gap-4">
      <InputField
        variant="default"
        disabled
        defaultValue="Disabled default variant"
      />
      <InputField
        variant="ghost"
        disabled
        defaultValue="Disabled ghost variant"
      />
      <InputField
        variant="filled"
        disabled
        defaultValue="Disabled filled variant"
      />
      <InputField
        variant="outline"
        disabled
        defaultValue="Disabled outline variant"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows how disabled state looks across all variants',
      },
    },
  },
};

export const ReadOnlyVariants: Story = {
  name: 'Read-Only States (All Variants)',
  render: () => (
    <div className="flex flex-col gap-4">
      <InputField
        variant="default"
        readOnly
        defaultValue="Read-only default variant"
      />
      <InputField
        variant="ghost"
        readOnly
        defaultValue="Read-only ghost variant"
      />
      <InputField
        variant="filled"
        readOnly
        defaultValue="Read-only filled variant"
      />
      <InputField
        variant="outline"
        readOnly
        defaultValue="Read-only outline variant"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows how read-only state looks across all variants',
      },
    },
  },
};

export const InvalidVariants: Story = {
  name: 'Invalid States (All Variants)',
  render: () => (
    <div className="flex flex-col gap-4">
      <InputField
        variant="default"
        aria-invalid
        defaultValue="Invalid default variant"
      />
      <InputField
        variant="ghost"
        aria-invalid
        defaultValue="Invalid ghost variant"
      />
      <InputField
        variant="filled"
        aria-invalid
        defaultValue="Invalid filled variant"
      />
      <InputField
        variant="outline"
        aria-invalid
        defaultValue="Invalid outline variant"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows how invalid state looks across all variants',
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
            className="hover:text-contrast"
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
      <InputField
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Type something..."
        suffixComponent={
          value && (
            <button
              type="button"
              onClick={() => setValue('')}
              className="hover:text-contrast"
            >
              <X className="h-4 w-4" />
            </button>
          )
        }
      />
    );
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

export const ComplexExample: Story = {
  name: 'Complex Example with Multiple Sizes',
  render: () => (
    <div className="flex flex-col gap-4">
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
};

export const VariantExamplesWithIcons: Story = {
  name: 'Variants with Icons',
  render: () => (
    <div className="flex flex-col gap-4">
      <InputField
        variant="default"
        placeholder="Default with search"
        prefixComponent={<Search className="h-4 w-4" />}
      />
      <InputField
        variant="ghost"
        placeholder="Ghost with mail"
        prefixComponent={<Mail className="h-4 w-4" />}
      />
      <InputField
        variant="filled"
        placeholder="Filled with lock"
        prefixComponent={<Lock className="h-4 w-4" />}
      />
      <InputField
        variant="outline"
        placeholder="Outline with user"
        prefixComponent={<User className="h-4 w-4" />}
      />
    </div>
  ),
};

export const DisabledWithIcons: Story = {
  name: 'Disabled States with Icons',
  render: () => (
    <div className="flex flex-col gap-4">
      <InputField
        disabled
        defaultValue="Disabled with prefix"
        prefixComponent={<Mail className="h-4 w-4" />}
      />
      <InputField
        disabled
        defaultValue="Disabled with suffix"
        suffixComponent={<Lock className="h-4 w-4" />}
      />
      <InputField
        disabled
        defaultValue="Disabled with both"
        prefixComponent={<User className="h-4 w-4" />}
        suffixComponent={<Check className="h-4 w-4" />}
      />
    </div>
  ),
};

export const Playground: Story = {
  args: {
    size: 'md',
    variant: 'default',
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
