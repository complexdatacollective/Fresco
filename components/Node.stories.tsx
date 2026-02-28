import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import Node, { NodeColors } from './Node';

const meta: Meta<typeof Node> = {
  title: 'Components/Node',
  component: Node,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
The Node component is the fundamental representation of an entity in Network Canvas.
Nodes represent people, places, organizations, or other entities in social network interviews.

## Visual States
- **Focus**: Outline ring (via \`focusable\` utility) - color matches node color
- **Selected**: Box-shadow ring with spring animation
- **Linking**: Pulsing box-shadow ring (separate layer, can be active with selected)
- **Loading**: Spinner replaces label
- **Disabled**: Desaturated, no pointer events

## Interaction Behaviors (Inferred)
Interaction behaviors are automatically inferred from the props you provide:
- **onClick provided**: Enables press animation, sets pointer cursor
- **style.cursor provided**: Uses that cursor (e.g., \`'grab'\` from drag systems like useDragSource)
- **Neither**: Default cursor, no press animation (display only)

This design allows the Node to integrate seamlessly with external interaction systems
without needing explicit mode flags.
        `,
      },
    },
  },
  argTypes: {
    label: {
      control: 'text',
      description:
        'Text displayed inside the node. Long labels are truncated with ellipsis.',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'Node' },
      },
    },
    size: {
      control: 'select',
      options: ['xxs', 'xs', 'sm', 'md', 'lg'],
      description: 'Size of the node.',
      table: {
        type: { summary: "'xxs' | 'xs' | 'sm' | 'md' | 'lg'" },
        defaultValue: { summary: 'md' },
      },
    },
    shape: {
      control: 'select',
      options: ['circle', 'square'],
      description: 'Shape of the node.',
      table: {
        type: { summary: "'circle' | 'square'" },
        defaultValue: { summary: 'circle' },
      },
    },
    color: {
      control: 'select',
      options: NodeColors,
      description:
        'Color scheme for the node. Also affects the focus ring color.',
      table: {
        type: { summary: 'NodeColorSequence' },
        defaultValue: { summary: 'node-color-seq-1' },
      },
    },
    selected: {
      control: 'boolean',
      description:
        'Whether the node is selected. Shows a box-shadow ring with spring animation.',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    linking: {
      control: 'boolean',
      description:
        'Whether the node is in linking mode. Shows a pulsing box-shadow animation.',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    loading: {
      control: 'boolean',
      description:
        'Whether the node is in loading state. Shows a spinner instead of the label.',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    disabled: {
      control: 'boolean',
      description:
        'Whether the node is disabled. Desaturated appearance, no pointer events.',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    onClick: {
      description:
        'Click handler. When provided, enables press animation and pointer cursor.',
      table: {
        type: { summary: '(event: MouseEvent) => void' },
      },
    },
    onPointerDown: {
      table: { disable: true },
    },
    onPointerUp: {
      table: { disable: true },
    },
  },
  args: {
    label: 'Node',
    size: 'md',
    shape: 'circle',
    color: 'node-color-seq-1',
    selected: false,
    linking: false,
    loading: false,
    disabled: false,
  },
};

export default meta;
type Story = StoryObj<typeof Node>;

/**
 * The default node with standard settings.
 * Use the controls panel to experiment with different props.
 */
export const Default: Story = {
  render: (args) => <Node {...args} />,
};

/**
 * Nodes come in five sizes, from xxs (32px) to lg (128px).
 */
export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-8">
      {(['xxs', 'xs', 'sm', 'md', 'lg'] as const).map((size) => (
        <div key={size} className="flex flex-col items-center gap-2">
          <Node size={size} label={size.toUpperCase()} />
          <span className="text-xs text-current/70">{size}</span>
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Available sizes: `xxs` (32px), `xs` (64px), `sm` (80px), `md` (104px), `lg` (128px).',
      },
    },
  },
};

/**
 * Nodes can be circular or square.
 */
export const Shapes: Story = {
  render: () => (
    <div className="flex gap-8">
      {(['circle', 'square'] as const).map((shape) => (
        <div key={shape} className="flex flex-col items-center gap-2">
          <Node shape={shape} label={shape} />
          <span className="text-xs text-current/70">{shape}</span>
        </div>
      ))}
    </div>
  ),
};

/**
 * Eight predefined colors are available, plus a custom option for arbitrary colors.
 */
export const Colors: Story = {
  render: () => (
    <div className="grid grid-cols-4 gap-6">
      {NodeColors.filter((c) => c !== 'custom').map((color, i) => (
        <div key={color} className="flex flex-col items-center gap-2">
          <Node color={color} label={`Color ${i + 1}`} />
          <span className="text-xs text-current/70">{i + 1}</span>
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Colors are defined in the theme and can be customized per-protocol. The focus ring color matches the node color.',
      },
    },
  },
};

/**
 * Demonstrates all visual states a node can be in.
 */
export const VisualStates: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-8">
      <div className="flex flex-col items-center gap-2">
        <Node label="Default" />
        <span className="text-xs text-current/70">Default</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Node label="Selected" selected color="node-color-seq-2" />
        <span className="text-xs text-current/70">Selected</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Node label="Linking" linking color="node-color-seq-3" />
        <span className="text-xs text-current/70">Linking</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Node label="Loading" loading color="node-color-seq-4" />
        <span className="text-xs text-current/70">Loading</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Node label="Disabled" disabled color="node-color-seq-5" />
        <span className="text-xs text-current/70">Disabled</span>
      </div>
    </div>
  ),
  parameters: {
    chromatic: { pauseAnimationAtEnd: true },
    docs: {
      description: {
        story: `
- **Default**: Normal appearance
- **Selected**: Box-shadow ring with spring animation
- **Linking**: Pulsing box-shadow animation (for creating connections)
- **Loading**: Spinner replaces the label
- **Disabled**: Desaturated, no interactions
        `,
      },
    },
  },
};

/**
 * Selected and linking can be active simultaneously.
 * Each uses a separate visual layer (both use box-shadow but are independent).
 */
export const CombinedStates: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-8">
      <div className="flex flex-col items-center gap-2">
        <Node label="Selected" selected color="node-color-seq-1" />
        <span className="text-xs text-current/70">Selected only</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Node label="Linking" linking color="node-color-seq-2" />
        <span className="text-xs text-current/70">Linking only</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Node label="Both" selected linking color="node-color-seq-3" />
        <span className="text-xs text-current/70">Both active</span>
      </div>
    </div>
  ),
  parameters: {
    chromatic: { pauseAnimationAtEnd: true },
    docs: {
      description: {
        story:
          'The linking animation is rendered on a separate element, so it can pulse independently while the selected state remains visible.',
      },
    },
  },
};

/**
 * Focus ring is shown on keyboard focus and uses the node's color.
 * Tab through the nodes to see the focus ring.
 */
export const FocusRing: Story = {
  render: () => (
    <div className="flex gap-8">
      {(
        [
          'node-color-seq-1',
          'node-color-seq-2',
          'node-color-seq-3',
          'node-color-seq-4',
        ] as const
      ).map((color, i) => (
        <Node key={color} color={color} label={`Tab ${i + 1}`} />
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Press **Tab** to navigate between nodes and see the colored focus ring. The focus ring color matches the node color.',
      },
    },
  },
};

/**
 * Long labels are automatically truncated with an ellipsis.
 */
export const LongLabels: Story = {
  render: () => (
    <div className="flex gap-6">
      <div className="flex flex-col items-center gap-2">
        <Node label="Short" />
        <span className="text-xs text-current/70">Short</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Node label="Medium Label" color="node-color-seq-2" />
        <span className="text-xs text-current/70">Medium</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Node label="This is a very long label" color="node-color-seq-3" />
        <span className="text-xs text-current/70">Truncated</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Labels longer than 22 characters are truncated with a soft hyphen and ellipsis.',
      },
    },
  },
};

/**
 * Interaction behaviors are inferred from the props you provide.
 */
export const InferredBehaviors: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="mb-2 text-sm font-medium">With onClick (Clickable)</h3>
        <p className="mb-4 text-xs text-current/70">
          Pointer cursor, press animation on click. Behavior is inferred from
          onClick being present.
        </p>
        {/* eslint-disable-next-line no-console */}
        <Node label="Clickable" onClick={() => console.log('clicked')} />
      </div>
      <div>
        <h3 className="mb-2 text-sm font-medium">
          With style.cursor (Draggable)
        </h3>
        <p className="mb-4 text-xs text-current/70">
          Grab cursor from external style. This is how drag systems like
          useDragSource integrate.
        </p>
        <Node
          label="Draggable"
          style={{ cursor: 'grab' }}
          color="node-color-seq-2"
        />
      </div>
      <div>
        <h3 className="mb-2 text-sm font-medium">Both onClick & Cursor</h3>
        <p className="mb-4 text-xs text-current/70">
          External cursor style takes precedence, but press animation still
          works from onClick.
        </p>
        <Node
          label="Both"
          style={{ cursor: 'grab' }}
          // eslint-disable-next-line no-console
          onClick={() => console.log('clicked')}
          color="node-color-seq-3"
        />
      </div>
      <div>
        <h3 className="mb-2 text-sm font-medium">Display Only</h3>
        <p className="mb-4 text-xs text-current/70">
          No onClick, no cursor override. Default cursor, no press animation.
        </p>
        <Node label="Display" color="node-color-seq-4" />
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: `
Interaction behaviors are automatically inferred:
- **onClick present**: Pointer cursor + press animation
- **style.cursor provided**: Uses that cursor (e.g., \`'grab'\` from drag systems)
- **Both**: External cursor wins, press animation still enabled
- **Neither**: Default cursor + no animation (display only)

This allows seamless integration with external systems like \`useDragSource\` without explicit mode flags.
        `,
      },
    },
  },
};

/**
 * Interactive example demonstrating selection toggling with actions.
 */
export const SelectionDemo: Story = {
  render: function SelectionDemoRender(args) {
    const [selected, setSelected] = useState(false);
    return (
      <div className="flex flex-col items-center gap-4">
        <Node
          {...args}
          selected={selected}
          onClick={() => setSelected((s) => !s)}
        />
        <span className="text-xs text-current/70">
          Click to toggle selection
        </span>
      </div>
    );
  },
  args: {
    label: 'Click Me',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Click the node to toggle selection. Notice the spring animation when selecting and the smooth fade when deselecting.',
      },
    },
  },
};

/**
 * Interactive example with multiple nodes for selection and linking.
 */
export const InteractiveDemo: Story = {
  render: function InteractiveDemoRender() {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [linkingId, setLinkingId] = useState<string | null>(null);

    const nodes = [
      { id: '1', label: 'Alice', color: 'node-color-seq-1' as const },
      { id: '2', label: 'Bob', color: 'node-color-seq-2' as const },
      { id: '3', label: 'Carol', color: 'node-color-seq-3' as const },
      { id: '4', label: 'David', color: 'node-color-seq-4' as const },
    ];

    const toggleSelection = (id: string) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    };

    const toggleLinking = (id: string) => {
      setLinkingId((prev) => (prev === id ? null : id));
    };

    return (
      <div className="flex flex-col gap-8">
        <div>
          <p className="mb-4 text-sm text-current/70">
            <strong>Click</strong> to toggle selection ·{' '}
            <strong>Shift+Click</strong> to toggle linking mode
          </p>
          <div className="flex gap-6">
            {nodes.map((node) => (
              <Node
                key={node.id}
                label={node.label}
                color={node.color}
                selected={selectedIds.has(node.id)}
                linking={linkingId === node.id}
                onClick={(e) => {
                  if (e.shiftKey) {
                    toggleLinking(node.id);
                  } else {
                    toggleSelection(node.id);
                  }
                }}
              />
            ))}
          </div>
        </div>
        <div className="text-xs text-current/70">
          <div>
            Selected:{' '}
            {selectedIds.size > 0 ? Array.from(selectedIds).join(', ') : 'none'}
          </div>
          <div>Linking: {linkingId ?? 'none'}</div>
        </div>
      </div>
    );
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story:
          'A more complete demo showing multiple nodes with selection and linking. Click to select, Shift+click to enter linking mode.',
      },
    },
  },
};

/**
 * Disabled nodes cannot be interacted with.
 */
export const DisabledNodes: Story = {
  render: () => (
    <div className="flex gap-8">
      <div className="flex flex-col items-center gap-2">
        <Node label="Enabled" />
        <span className="text-xs text-current/70">Enabled</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Node label="Disabled" disabled color="node-color-seq-2" />
        <span className="text-xs text-current/70">Disabled</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Node label="Selected" disabled selected color="node-color-seq-3" />
        <span className="text-xs text-current/70">Disabled + Selected</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Disabled nodes are desaturated and have `pointer-events: none`. Visual states like selected can still be shown.',
      },
    },
  },
};

/**
 * All colors with the selected state to demonstrate the selection ring.
 */
export const SelectedColors: Story = {
  render: () => (
    <div className="grid grid-cols-4 gap-6">
      {NodeColors.filter((c) => c !== 'custom').map((color, i) => (
        <Node key={color} color={color} label={`Color ${i + 1}`} selected />
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'The selected state uses `--color-selected` for the box-shadow, which is consistent across all node colors.',
      },
    },
  },
};

/**
 * All colors in linking mode to demonstrate the pulsing animation.
 */
export const LinkingColors: Story = {
  render: () => (
    <div className="grid grid-cols-4 gap-6">
      {NodeColors.filter((c) => c !== 'custom').map((color, i) => (
        <Node key={color} color={color} label={`Color ${i + 1}`} linking />
      ))}
    </div>
  ),
  parameters: {
    chromatic: { pauseAnimationAtEnd: true },
    docs: {
      description: {
        story:
          'The linking animation uses a pulsing box-shadow effect to indicate the node is ready to form a connection.',
      },
    },
  },
};
