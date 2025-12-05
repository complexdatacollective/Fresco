import type { Meta, StoryFn } from '@storybook/nextjs-vite';
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
        options: ['xxs', 'xs', 'sm', 'md', 'lg'],
      },
      description: 'Size of the node.',
      defaultValue: 'md',
    },
    shape: {
      control: {
        type: 'select',
        options: [
          'circle',
          'square',
          'star',
          'triangle',
          'flower',
          'rhombus',
          'hexagon',
          'octagon',
          'heart',
        ],
      },
      description: 'Shape of the node.',
      defaultValue: 'circle',
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

Default.args = {
  label: 'Node',
  size: 'md',
  color: 'node-color-seq-1',
};

// Different Sizes
export const Sizes: StoryFn<typeof Node> = () => (
  <div className="flex items-end gap-8">
    <div className="flex flex-col items-center gap-2">
      <Node size="xxs" label="XXS" />
      <span className="text-xs text-current/70">xxs (32px)</span>
    </div>
    <div className="flex flex-col items-center gap-2">
      <Node size="xs" label="XS" />
      <span className="text-xs text-current/70">xs (64px)</span>
    </div>
    <div className="flex flex-col items-center gap-2">
      <Node size="sm" label="SM" />
      <span className="text-xs text-current/70">sm (80px)</span>
    </div>
    <div className="flex flex-col items-center gap-2">
      <Node size="md" label="MD" />
      <span className="text-xs text-current/70">md (104px)</span>
    </div>
    <div className="flex flex-col items-center gap-2">
      <Node size="lg" label="LG" />
      <span className="text-xs text-current/70">lg (128px)</span>
    </div>
  </div>
);

// Different Shapes
export const Shapes: StoryFn<typeof Node> = () => (
  <div className="flex flex-col gap-8">
    <div>
      <h3 className="mb-4 text-lg font-semibold">All Available Shapes</h3>
      <div className="grid grid-cols-5 gap-8">
        <div className="flex flex-col items-center gap-2">
          <Node shape="circle" label="Circle" />
          <span className="text-xs text-current/70">Circle</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Node shape="square" label="Square" />
          <span className="text-xs text-current/70">Square</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Node shape="star" label="Star" />
          <span className="text-xs text-current/70">Star</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Node shape="triangle" label="Triangle" />
          <span className="text-xs text-current/70">Triangle</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Node shape="flower" label="Flower" />
          <span className="text-xs text-current/70">Flower</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Node shape="rhombus" label="Rhombus" />
          <span className="text-xs text-current/70">Rhombus</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Node shape="hexagon" label="Hexagon" />
          <span className="text-xs text-current/70">Hexagon</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Node shape="octagon" label="Octagon" />
          <span className="text-xs text-current/70">Octagon</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Node shape="heart" label="Heart" />
          <span className="text-xs text-current/70">Heart</span>
        </div>
      </div>
    </div>
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
  <div className="flex flex-wrap items-center gap-8">
    <div className="flex flex-col items-center gap-2">
      <Node label="Default" />
      <span className="text-xs text-current/70">Default</span>
    </div>
    <div className="flex flex-col items-center gap-2">
      <Node label="Selected" selected />
      <span className="text-xs text-current/70">Selected</span>
    </div>
    <div className="flex flex-col items-center gap-2">
      <Node label="Linking" linking />
      <span className="text-xs text-current/70">Linking</span>
    </div>
    <div className="flex flex-col items-center gap-2">
      <Node label="Loading" loading />
      <span className="text-xs text-current/70">Loading</span>
    </div>
    <div className="flex flex-col items-center gap-2">
      <Node label="Disabled" disabled={true} />
      <span className="text-xs text-current/70">Disabled</span>
    </div>
  </div>
);

// Selected Border Scaling
export const SelectedBorderScaling: StoryFn<typeof Node> = () => (
  <div className="flex flex-col gap-8">
    <div>
      <h3 className="mb-4 text-lg font-semibold">
        Selected State - Border scales proportionally with size
      </h3>
      <p className="mb-4 text-sm text-current/70">
        Circle and square shapes use borders. Clipped shapes (star, triangle,
        etc.) use drop-shadow for proper outline rendering.
      </p>
      <div className="flex items-end gap-8">
        <div className="flex flex-col items-center gap-2">
          <Node size="xxs" label="XXS" selected />
          <span className="text-xs text-current/70">2px</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Node size="xs" label="XS" selected />
          <span className="text-xs text-current/70">3px</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Node size="sm" label="SM" selected />
          <span className="text-xs text-current/70">4px</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Node size="md" label="MD" selected />
          <span className="text-xs text-current/70">5px</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Node size="lg" label="LG" selected />
          <span className="text-xs text-current/70">7px</span>
        </div>
      </div>
    </div>
    <div>
      <h3 className="mb-4 text-lg font-semibold">
        Selected State - Clipped Shapes
      </h3>
      <div className="flex items-end gap-8">
        <div className="flex flex-col items-center gap-2">
          <Node size="md" shape="star" label="Star" selected />
          <span className="text-xs text-current/70">Star</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Node size="md" shape="triangle" label="Triangle" selected />
          <span className="text-xs text-current/70">Triangle</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Node size="md" shape="hexagon" label="Hexagon" selected />
          <span className="text-xs text-current/70">Hexagon</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Node size="md" shape="heart" label="Heart" selected />
          <span className="text-xs text-current/70">Heart</span>
        </div>
      </div>
    </div>
  </div>
);

// Linking Border Scaling
export const LinkingBorderScaling: StoryFn<typeof Node> = () => (
  <div className="flex flex-col gap-8">
    <div>
      <h3 className="mb-4 text-lg font-semibold">
        Linking State - Border scales proportionally with size
      </h3>
      <p className="mb-4 text-sm text-current/70">
        Circle and square shapes use borders with pulsing animation. Clipped
        shapes use drop-shadow with the same animation effect.
      </p>
      <div className="flex items-end gap-8">
        <div className="flex flex-col items-center gap-2">
          <Node size="xxs" label="XXS" linking />
          <span className="text-xs text-current/70">1px</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Node size="xs" label="XS" linking />
          <span className="text-xs text-current/70">2px</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Node size="sm" label="SM" linking />
          <span className="text-xs text-current/70">2px</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Node size="md" label="MD" linking />
          <span className="text-xs text-current/70">3px</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Node size="lg" label="LG" linking />
          <span className="text-xs text-current/70">4px</span>
        </div>
      </div>
    </div>
    <div>
      <h3 className="mb-4 text-lg font-semibold">
        Linking State - Clipped Shapes
      </h3>
      <div className="flex items-end gap-8">
        <div className="flex flex-col items-center gap-2">
          <Node size="md" shape="star" label="Star" linking />
          <span className="text-xs text-current/70">Star</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Node size="md" shape="triangle" label="Triangle" linking />
          <span className="text-xs text-current/70">Triangle</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Node size="md" shape="rhombus" label="Rhombus" linking />
          <span className="text-xs text-current/70">Rhombus</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Node size="md" shape="flower" label="Flower" linking />
          <span className="text-xs text-current/70">Flower</span>
        </div>
      </div>
    </div>
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

// Shapes with States
export const ShapesWithStates: StoryFn<typeof Node> = () => (
  <div className="flex flex-col gap-8">
    <div>
      <h3 className="mb-4 text-lg font-semibold">Shapes - Default State</h3>
      <div className="flex flex-wrap gap-6">
        <Node shape="circle" label="Circle" size="sm" />
        <Node shape="square" label="Square" size="sm" />
        <Node shape="star" label="Star" size="sm" />
        <Node shape="triangle" label="Triangle" size="sm" />
        <Node shape="heart" label="Heart" size="sm" />
      </div>
    </div>
    <div>
      <h3 className="mb-4 text-lg font-semibold">Shapes - Selected State</h3>
      <div className="flex flex-wrap gap-6">
        <Node
          shape="circle"
          label="Circle"
          size="sm"
          selected
          color="node-color-seq-2"
        />
        <Node
          shape="square"
          label="Square"
          size="sm"
          selected
          color="node-color-seq-3"
        />
        <Node
          shape="star"
          label="Star"
          size="sm"
          selected
          color="node-color-seq-4"
        />
        <Node
          shape="triangle"
          label="Triangle"
          size="sm"
          selected
          color="node-color-seq-5"
        />
        <Node
          shape="heart"
          label="Heart"
          size="sm"
          selected
          color="node-color-seq-6"
        />
      </div>
    </div>
    <div>
      <h3 className="mb-4 text-lg font-semibold">Shapes - Linking State</h3>
      <div className="flex flex-wrap gap-6">
        <Node
          shape="circle"
          label="Circle"
          size="sm"
          linking
          color="node-color-seq-7"
        />
        <Node
          shape="hexagon"
          label="Hexagon"
          size="sm"
          linking
          color="node-color-seq-8"
        />
        <Node
          shape="rhombus"
          label="Rhombus"
          size="sm"
          linking
          color="node-color-seq-2"
        />
        <Node
          shape="octagon"
          label="Octagon"
          size="sm"
          linking
          color="node-color-seq-3"
        />
        <Node
          shape="flower"
          label="Flower"
          size="sm"
          linking
          color="node-color-seq-4"
        />
      </div>
    </div>
  </div>
);

// Comprehensive Example
export const ComprehensiveExample: StoryFn<typeof Node> = () => (
  <div className="flex flex-col gap-8">
    <div>
      <h3 className="mb-4 text-lg font-semibold">Different Colors</h3>
      <div className="flex flex-wrap gap-4">
        {NodeColors.map((color, index) => (
          <Node
            key={color}
            color={color}
            label={`Person ${index + 1}`}
            size="sm"
          />
        ))}
      </div>
    </div>
    <div>
      <h3 className="mb-4 text-lg font-semibold">Selected Nodes</h3>
      <div className="flex flex-wrap gap-4">
        {NodeColors.slice(0, 4).map((color, index) => (
          <Node
            key={color}
            color={color}
            label={`Person ${index + 1}`}
            size="sm"
            selected
          />
        ))}
      </div>
    </div>
    <div>
      <h3 className="mb-4 text-lg font-semibold">Linking Nodes</h3>
      <div className="flex flex-wrap gap-4">
        {NodeColors.slice(0, 4).map((color, index) => (
          <Node
            key={color}
            color={color}
            label={`Person ${index + 1}`}
            size="sm"
            linking
          />
        ))}
      </div>
    </div>
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
