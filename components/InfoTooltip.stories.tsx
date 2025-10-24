import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { HelpCircle, Star } from 'lucide-react';
import { Label } from '~/lib/form/components/Label';
import InfoTooltip from './InfoTooltip';
import Heading from './typography/Heading';
import { Button } from './ui/Button';

const meta = {
  title: 'Components/InfoTooltip',
  component: InfoTooltip,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'The title of the tooltip',
    },
    description: {
      control: 'text',
      description:
        'The description content - can be a string or a render function for complex content',
    },
  },
} satisfies Meta<typeof InfoTooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Information',
    description:
      'This is a helpful tooltip with information about this feature.',
  },
};

export const LongDescription: Story = {
  args: {
    title: 'Detailed Information',
    description:
      'This tooltip contains a much longer description that explains the feature in greater detail. It will wrap appropriately within the maximum width constraint.',
  },
};

export const CustomTrigger: Story = {
  args: {
    title: 'Custom Trigger',
    description:
      'This tooltip uses a custom trigger element instead of the default info icon.',
  },
  render: (args) => (
    <InfoTooltip
      {...args}
      trigger={(props) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { color, ...buttonProps } = props;
        return (
          <Button variant="outline" size="sm" {...buttonProps}>
            <HelpCircle className="mr-2 h-4 w-4" />
            Help
          </Button>
        );
      }}
    />
  ),
};

export const ComplexDescription: Story = {
  args: {
    title: 'Feature Details',
    description: 'This will be overridden in render',
  },
  render: (args) => (
    <InfoTooltip
      {...args}
      description={(props) => (
        <div {...props}>
          <p className="mb-2">This tooltip contains multiple elements:</p>
          <ul className="mb-2 list-inside list-disc space-y-1">
            <li>First item with details</li>
            <li>Second item with more information</li>
            <li>Third item for completeness</li>
          </ul>
          <p className="text-sm italic">
            Use render functions for complex layouts.
          </p>
        </div>
      )}
    />
  ),
};

export const WithFormattedContent: Story = {
  args: {
    title: 'Markdown-style Content',
    description: 'This will be overridden in render',
  },
  render: (args) => (
    <InfoTooltip
      {...args}
      description={(props) => (
        <div {...props} className="space-y-2">
          <p>
            <strong>Important:</strong> This feature requires proper
            configuration.
          </p>
          <p>
            You can use{' '}
            <code className="rounded bg-gray-100 px-1">code snippets</code> and
            other formatting.
          </p>
          <p className="text-xs text-gray-500">
            Note: Hover behavior is automatic.
          </p>
        </div>
      )}
    />
  ),
};

export const DifferentTriggerIcons: Story = {
  args: {
    title: 'Different Triggers',
    description: 'Different icon triggers example',
  },
  render: () => (
    <div className="flex items-center gap-8">
      <InfoTooltip
        title="Info Icon"
        description="This uses the default info icon trigger."
      />
      <InfoTooltip
        title="Help Circle"
        description="This uses a help circle icon."
        trigger={(props) => (
          <HelpCircle className="h-5 w-5 text-blue-500" {...props} />
        )}
      />
      <InfoTooltip
        title="Star Icon"
        description="This uses a star icon for something special."
        trigger={(props) => (
          <Star className="h-5 w-5 text-yellow-500" {...props} />
        )}
      />
    </div>
  ),
};

export const InContext: Story = {
  args: {
    title: 'In Context',
    description: 'Examples in context',
  },
  render: () => (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-center gap-2">
        <Label>
          Field Name{' '}
          <InfoTooltip
            title="Field Information"
            description="This field is used to capture the participant's primary identifier."
          />
        </Label>
      </div>

      <div className="flex items-center gap-2">
        <Heading level="h3">
          Section Title
          <InfoTooltip
            title="Section Details"
            description={(props) => (
              <div {...props}>
                <p className="mb-2">
                  This section contains important configuration options:
                </p>
                <ul className="list-inside list-disc space-y-1">
                  <li>Option 1: Enables feature X</li>
                  <li>Option 2: Controls behavior Y</li>
                  <li>Option 3: Sets default Z</li>
                </ul>
              </div>
            )}
          />
        </Heading>
      </div>

      <div className="rounded border p-4">
        <div className="mb-2 flex items-center justify-between">
          <Heading level="h4">Advanced Settings</Heading>
          <InfoTooltip
            title="Advanced Mode"
            description="Enabling advanced mode unlocks additional configuration options for power users."
            trigger={(props) => {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { color, ...buttonProps } = props;
              return (
                <Button variant="text" size="icon" {...buttonProps}>
                  <HelpCircle className="h-4 w-4" />
                </Button>
              );
            }}
          />
        </div>
        <p className="text-sm text-gray-600">
          Example content showing how the tooltip integrates with other UI
          elements.
        </p>
      </div>
    </div>
  ),
};
