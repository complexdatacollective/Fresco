import type { Meta, StoryObj } from '@storybook/react';
import {
  ChevronRight,
  Download,
  Heart,
  Save,
  Trash2,
  Upload,
} from 'lucide-react';
import Button from './Button';

const meta = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A versatile button component with multiple color variants, sizes, and icon support.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    color: {
      control: 'select',
      options: [
        'default',
        'primary',
        'secondary',
        'destructive',
        'success',
        'warning',
        'info',
        'white',
        'platinum',
        'platinum-dark',
        'sea-green',
        'mustard',
        'neon-coral',
        'slate-blue',
        'cyber-grape',
      ],
      description: 'Color variant of the button',
    },
    size: {
      control: 'select',
      options: ['default', 'small'],
      description: 'Size variant of the button',
    },
    icon: {
      control: 'select',
      options: [
        'none',
        'save',
        'download',
        'upload',
        'trash-2',
        'heart',
        'chevron-right',
      ],
      mapping: {
        'none': undefined,
        'save': 'save',
        'download': 'download',
        'upload': 'upload',
        'trash-2': 'trash-2',
        'heart': 'heart',
        'chevron-right': 'chevron-right',
      },
      description: 'Icon to display in the button',
    },
    iconPosition: {
      control: 'radio',
      options: ['left', 'right'],
      description: 'Position of the icon',
    },
    loading: {
      control: 'boolean',
      description: 'Loading state of the button',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state of the button',
    },
    children: {
      control: 'text',
      description: 'Button text content',
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic Examples
export const Default: Story = {
  args: {
    children: 'Button',
  },
};

export const Primary: Story = {
  args: {
    children: 'Primary Button',
    color: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Secondary Button',
    color: 'secondary',
  },
};

export const Destructive: Story = {
  args: {
    children: 'Delete',
    color: 'destructive',
  },
};

export const Success: Story = {
  args: {
    children: 'Success',
    color: 'success',
  },
};

export const Warning: Story = {
  args: {
    children: 'Warning',
    color: 'warning',
  },
};

export const Info: Story = {
  args: {
    children: 'Info',
    color: 'info',
  },
};

// Size Variants
export const Small: Story = {
  args: {
    children: 'Small Button',
    size: 'small',
  },
};

export const LargeDefault: Story = {
  args: {
    children: 'Default Size',
    size: 'default',
  },
};

// Icon Examples
export const WithIconLeft: Story = {
  args: {
    children: 'Save',
    icon: 'save',
    iconPosition: 'left',
  },
};

export const WithIconRight: Story = {
  args: {
    children: 'Next',
    icon: 'chevron-right',
    iconPosition: 'right',
  },
};

export const IconOnly: Story = {
  args: {
    'icon': 'heart',
    'aria-label': 'Like',
  },
};

// States
export const Loading: Story = {
  args: {
    children: 'Loading...',
    loading: true,
  },
};

export const Disabled: Story = {
  args: {
    children: 'Disabled',
    disabled: true,
  },
};

export const LoadingWithIcon: Story = {
  args: {
    children: 'Uploading',
    icon: 'upload',
    loading: true,
  },
};

// Color Showcase
export const ColorShowcase: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button color="default">Default</Button>
      <Button color="primary">Primary</Button>
      <Button color="secondary">Secondary</Button>
      <Button color="destructive">Destructive</Button>
      <Button color="success">Success</Button>
      <Button color="warning">Warning</Button>
      <Button color="info">Info</Button>
      <Button color="sea-green">Sea Green</Button>
      <Button color="mustard">Mustard</Button>
      <Button color="neon-coral">Neon Coral</Button>
      <Button color="slate-blue">Slate Blue</Button>
      <Button color="cyber-grape">Cyber Grape</Button>
      <Button color="white">White</Button>
      <Button color="platinum">Platinum</Button>
      <Button color="platinum-dark">Platinum Dark</Button>
    </div>
  ),
};

// Size Comparison
export const SizeComparison: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="small">Small</Button>
      <Button size="default">Default</Button>
    </div>
  ),
};

// Icon Variations
export const IconVariations: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button icon="save">Save</Button>
      <Button icon="download">Download</Button>
      <Button icon="upload">Upload</Button>
      <Button icon="trash-2" color="destructive">
        Delete
      </Button>
      <Button icon="heart" color="neon-coral">
        Like
      </Button>
      <Button icon="chevron-right" iconPosition="right">
        Continue
      </Button>
    </div>
  ),
};

// State Examples
export const StateExamples: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button>Normal</Button>
      <Button disabled>Disabled</Button>
      <Button loading>Loading</Button>
      <Button icon="save" loading>
        Saving
      </Button>
    </div>
  ),
};

// Interactive Example
export const Interactive: Story = {
  args: {
    children: 'Click Me',
    onClick: () => alert('Button clicked!'),
  },
};

// Form Submit Button
export const FormSubmit: Story = {
  args: {
    children: 'Submit Form',
    type: 'submit',
    color: 'primary',
  },
};

// Complex Example
export const ComplexExample: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button color="primary" icon="save">
          Save Changes
        </Button>
        <Button color="secondary">Cancel</Button>
      </div>

      <div className="flex gap-2">
        <Button color="success" icon="upload">
          Upload File
        </Button>
        <Button color="destructive" icon="trash-2">
          Delete All
        </Button>
      </div>

      <div className="flex gap-2">
        <Button size="small" icon="download">
          Export
        </Button>
        <Button size="small" icon="chevron-right" iconPosition="right">
          Next Step
        </Button>
      </div>
    </div>
  ),
};

// Content vs Children
export const ContentProp: Story = {
  args: {
    content: 'Using content prop',
  },
};

export const ChildrenProp: Story = {
  args: {
    children: 'Using children prop',
  },
};
