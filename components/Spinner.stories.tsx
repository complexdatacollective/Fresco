import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import Spinner from './Spinner';

const meta: Meta<typeof Spinner> = {
  title: 'UI/Spinner',
  component: Spinner,
  tags: ['autodocs'],
  parameters: {
    chromatic: { disableSnapshot: true },
    layout: 'centered',
    docs: {
      description: {
        component: `
The Spinner component is an animated loading indicator featuring four colorful half-circles
that split apart and merge back together while the whole assembly rotates.

## Animation Modes
- **infinite**: Loops forever (default)
- **hover**: Plays once when hovered
- **once**: Plays once on mount then stops
- **controlled**: Use \`isAnimating\` prop to control programmatically

## Animation Features
- **Spring physics**: The split animation uses spring physics for a bouncy, organic feel
- **Color transitions**: Half-circles transition between light and dark variants as they move
- **Scale breathing**: The container pulses slightly larger during rotation

## Colors
The spinner uses four Network Canvas theme colors:
- Sea Serpent (blue)
- Mustard (yellow)
- Neon Coral (red/orange)
- Sea Green (teal)
        `,
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Size preset for the spinner.',
      table: {
        type: { summary: "'xs' | 'sm' | 'md' | 'lg' | 'xl'" },
        defaultValue: { summary: 'md' },
      },
    },
    customSize: {
      control: 'text',
      description:
        'Custom size value (e.g., "4rem"). Overrides the size preset.',
      table: {
        type: { summary: 'string' },
      },
    },
    animationMode: {
      control: 'select',
      options: ['infinite', 'hover', 'once', 'controlled'],
      description: 'Controls when and how the animation plays.',
      table: {
        type: { summary: "'infinite' | 'hover' | 'once' | 'controlled'" },
        defaultValue: { summary: 'infinite' },
      },
    },
    isAnimating: {
      control: 'boolean',
      description:
        'For controlled mode: whether the animation is currently playing.',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
      },
    },
  },
  args: {
    size: 'md',
    animationMode: 'infinite',
    isAnimating: true,
  },
};

export default meta;
type Story = StoryObj<typeof Spinner>;

/**
 * The default spinner with infinite animation.
 * Use the controls panel to experiment with different props.
 */
export const Default: Story = {
  render: (args) => <Spinner {...args} />,
};

/**
 * Spinners come in five size presets.
 */
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-12">
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <div key={size} className="flex flex-col items-center gap-4">
          <Spinner size={size} />
          <span className="text-xs text-current/70">{size}</span>
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
Available sizes:
- \`xs\`: 0.5rem circle size
- \`sm\`: 1rem circle size
- \`md\`: 1.5rem circle size (default)
- \`lg\`: 2rem circle size
- \`xl\`: 3rem circle size

The total spinner size is 3× the circle size, plus margin.
        `,
      },
    },
  },
};

/**
 * Use customSize for arbitrary dimensions.
 */
export const CustomSize: Story = {
  render: () => (
    <div className="flex items-center gap-12">
      <div className="flex flex-col items-center gap-4">
        <Spinner customSize="0.75rem" />
        <span className="text-xs text-current/70">0.75rem</span>
      </div>
      <div className="flex flex-col items-center gap-4">
        <Spinner customSize="2.5rem" />
        <span className="text-xs text-current/70">2.5rem</span>
      </div>
      <div className="flex flex-col items-center gap-4">
        <Spinner customSize="4rem" />
        <span className="text-xs text-current/70">4rem</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Use the `customSize` prop for sizes not covered by the presets. Any valid CSS length value works.',
      },
    },
  },
};

/**
 * Hover over the spinner to trigger the animation.
 */
export const HoverMode: Story = {
  render: () => (
    <div className="flex flex-col items-center gap-4">
      <Spinner size="lg" animationMode="hover" />
      <span className="text-sm text-current/70">Hover to animate</span>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'In hover mode, the spinner stays idle until hovered, then plays one full animation cycle.',
      },
    },
  },
};

/**
 * Plays once on mount then stops.
 */
export const OnceMode: Story = {
  render: () => (
    <div className="flex flex-col items-center gap-4">
      <Spinner size="lg" animationMode="once" />
      <span className="text-sm text-current/70">
        Plays once on mount (refresh to see again)
      </span>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'In once mode, the animation plays a single cycle when the component mounts, then stops.',
      },
    },
  },
};

/**
 * Control the animation programmatically with isAnimating.
 */
export const ControlledMode: Story = {
  render: function ControlledModeRender() {
    const [isAnimating, setIsAnimating] = useState(false);

    return (
      <div className="flex flex-col items-center gap-6">
        <Spinner
          size="lg"
          animationMode="controlled"
          isAnimating={isAnimating}
        />
        <button
          type="button"
          className="bg-primary text-primary-contrast rounded-sm px-4 py-2 text-sm"
          onClick={() => setIsAnimating((prev) => !prev)}
        >
          {isAnimating ? 'Stop' : 'Start'} Animation
        </button>
        <span className="text-xs text-current/70">
          isAnimating: {isAnimating ? 'true' : 'false'}
        </span>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: `
In controlled mode, use the \`isAnimating\` prop to programmatically start and stop the animation.
This is useful for showing loading states tied to async operations.
        `,
      },
    },
  },
};

/**
 * Compare all animation modes side by side.
 */
export const AnimationModes: Story = {
  render: function AnimationModesRender() {
    const [controlledAnimating, setControlledAnimating] = useState(true);

    return (
      <div className="grid grid-cols-2 gap-12 lg:grid-cols-4">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="md" animationMode="infinite" />
          <span className="text-xs font-medium">infinite</span>
          <span className="text-center text-xs text-current/70">
            Always spinning
          </span>
        </div>
        <div className="flex flex-col items-center gap-4">
          <Spinner size="md" animationMode="hover" />
          <span className="text-xs font-medium">hover</span>
          <span className="text-center text-xs text-current/70">
            Hover to spin
          </span>
        </div>
        <div className="flex flex-col items-center gap-4">
          <Spinner size="md" animationMode="once" />
          <span className="text-xs font-medium">once</span>
          <span className="text-center text-xs text-current/70">
            Spins once on mount
          </span>
        </div>
        <div className="flex flex-col items-center gap-4">
          <div
            className="cursor-pointer"
            onClick={() => setControlledAnimating((prev) => !prev)}
          >
            <Spinner
              size="md"
              animationMode="controlled"
              isAnimating={controlledAnimating}
            />
          </div>
          <span className="text-xs font-medium">controlled</span>
          <span className="text-center text-xs text-current/70">
            Click to toggle
          </span>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: `
All four animation modes side by side:
- **infinite**: Continuous animation
- **hover**: Animates on hover
- **once**: Single animation on mount
- **controlled**: Toggle with \`isAnimating\` prop
        `,
      },
    },
  },
};

/**
 * The split animation detail - half-circles separate and rejoin.
 */
export const SplitAnimation: Story = {
  render: () => (
    <div className="flex flex-col items-center gap-6">
      <Spinner size="xl" />
      <div className="max-w-sm text-center text-sm text-current/70">
        Watch the half-circles: they split apart with a spring bounce, change
        color, then snap back together. This creates the distinctive Network
        Canvas loading effect.
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
Each of the four circles is composed of two half-circles:
1. The first half-circle animates with spring physics, translating outward
2. As it moves, it transitions from light to dark color
3. Then it springs back, transitioning back to light
4. The second half-circle stays static

This creates a "splitting" and "merging" effect that gives the spinner its character.
        `,
      },
    },
  },
};

/**
 * Loading state example - common use case.
 */
export const LoadingState: Story = {
  render: function LoadingStateRender() {
    const [isLoading, setIsLoading] = useState(false);

    const simulateLoad = () => {
      setIsLoading(true);
      setTimeout(() => setIsLoading(false), 3000);
    };

    return (
      <div className="flex flex-col items-center gap-6">
        {isLoading ? (
          <div className="flex flex-col items-center gap-4">
            <Spinner size="lg" />
            <span className="text-sm text-current/70">Loading...</span>
          </div>
        ) : (
          <button
            type="button"
            className="bg-primary text-primary-contrast rounded-sm px-6 py-3"
            onClick={simulateLoad}
          >
            Load Data
          </button>
        )}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'A typical loading state pattern. Click the button to simulate a 3-second loading operation.',
      },
    },
  },
};

/**
 * Inline loading indicator.
 */
export const InlineLoading: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Spinner size="xs" />
      <span className="text-sm">Saving changes...</span>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Use the `xs` size for inline loading indicators next to text or within buttons.',
      },
    },
  },
};
