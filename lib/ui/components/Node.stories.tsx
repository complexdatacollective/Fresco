import type { Meta, StoryFn } from '@storybook/nextjs';
import Node, { NodeColors } from './Node';

const meta: Meta<typeof Node> = {
  title: 'UI/Node',
  component: Node,
  argTypes: {
    label: {
      control: 'text',
      description: 'Text displayed inside the node.',
      defaultValue: 'Node',
    },
    color: {
      control: {
        type: 'select',
        options: NodeColors,
      },
      description: 'Color scheme for the node.',
      defaultValue: 'node-color-seq-1',
    },
    selected: {
      control: 'boolean',
      description: 'Whether the node is selected.',
      defaultValue: false,
    },
    linking: {
      control: 'boolean',
      description: 'Whether the node is in linking mode.',
      defaultValue: false,
    },
    loading: {
      control: 'boolean',
      description: 'Whether the node is in loading state.',
      defaultValue: false,
    },
    size: {
      control: {
        type: 'select',
        options: ['sm', 'md', 'lg'],
      },
      description: 'Size of the node.',
      defaultValue: 'md',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the node is disabled.',
      defaultValue: false,
    },
    onClick: {
      action: 'clicked',
      description: 'Click handler for the node.',
    },
  },
  tags: ['autodocs'],
} as Meta<typeof Node>;

export default meta;

// Default Node
export const Default: StoryFn<typeof Node> = (args) => <Node {...args} />;

// Different Sizes
export const Sizes: StoryFn<typeof Node> = () => (
  <div className="flex items-center gap-8">
    <Node size="sm" label="Small" />
    <Node size="md" label="Medium" />
    <Node size="lg" label="Large" />
  </div>
);

// Different Colors
export const Colors: StoryFn<typeof Node> = () => (
  <div className="grid grid-cols-4 gap-6">
    {NodeColors.map((color) => (
      <Node
        key={color}
        color={color}
        label={color.replace('node-color-seq-', 'Color ')}
      />
    ))}
  </div>
);

// Node States
export const States: StoryFn<typeof Node> = () => (
  <div className="flex items-center gap-6">
    <Node label="Default" />
    <Node label="Selected" selected />
    <Node label="Loading" loading />
    <Node label="Disabled" disabled={true} />
    <Node label="Linking" linking />
  </div>
);

// Long Label Text
export const LongLabels: StoryFn<typeof Node> = () => (
  <div className="flex flex-col gap-6">
    <Node label="Short" />
    <Node label="Medium length label" />
    <Node label="This is a very long label that should be truncated with ellipsis" />
    <Node label="SuperExtremelyLongLabelWithoutSpacesThatShouldStillBeHandledProperly" />
  </div>
);

// Interactive Example
export const Interactive: StoryFn<typeof Node> = () => {
  const handleClick = () => {
    alert('Node clicked!');
  };

  return (
    <div className="flex flex-col gap-6">
      <h3 className="text-lg font-semibold">
        Click any node to see interaction
      </h3>
      <div className="flex gap-6">
        <Node label="Person 1" onClick={handleClick} />
        <Node label="Person 2" color="node-color-seq-2" onClick={handleClick} />
        <Node
          label="Person 3"
          color="node-color-seq-3"
          selected
          onClick={handleClick}
        />
      </div>
    </div>
  );
};
