import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { cx } from '~/utils/cva';
import { ScrollArea, type ScrollAreaProps } from './ScrollArea';

const meta: Meta<ScrollAreaProps> = {
  title: 'UI/ScrollArea',
  component: ScrollArea,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `A customizable scroll container built on Base UI's ScrollArea component.

## Features

- **Orientation**: Supports vertical, horizontal, or bidirectional scrolling
- **Fade effect**: Gradient fade at scroll edges that adapts to the background color
- **Scroll snap**: CSS scroll-snap support for mandatory or proximity snapping
- **Custom scrollbars**: Styled scrollbars that appear on hover or while scrolling

## Usage

The ScrollArea component uses \`flex-1\` internally, so it expands to fill its parent container.
Place it inside a flex container with a defined height for proper scrolling behavior.

\`\`\`tsx
<div className="flex h-64 flex-col">
  <ScrollArea className="publish-colors bg-background">
    {/* Scrollable content */}
  </ScrollArea>
</div>
\`\`\`

## Fade Effect with Custom Backgrounds

The fade effect uses the \`--published-bg\` CSS variable to match the background color.
Add \`publish-colors\` along with a \`bg-*\` class to the ScrollArea's className:

\`\`\`tsx
<ScrollArea className="publish-colors bg-surface-1" fade={true}>
  {/* Content */}
</ScrollArea>
\`\`\`

## Scroll Snap

Enable scroll snapping by setting the \`snap\` prop. Children should include snap alignment classes:

\`\`\`tsx
<ScrollArea snap="mandatory" >
  <div className="snap-start">Snaps to top</div>
  <div className="snap-center">Snaps to center</div>
  <div className="snap-end">Snaps to bottom</div>
</ScrollArea>
\`\`\`
`,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    fade: {
      control: 'boolean',
      description:
        'Shows gradient fade at scroll edges. The gradient color is determined by the background color when using `publish-colors` with a `bg-*` class.',
      table: {
        defaultValue: { summary: 'true' },
      },
    },
    snap: {
      control: 'select',
      options: [undefined, 'mandatory', 'proximity'],
      description:
        'Enables CSS scroll-snap. "mandatory" always snaps to the nearest item, "proximity" only snaps when close to a snap point. Children need `snap-start`, `snap-center`, or `snap-end` classes.',
      table: {
        defaultValue: { summary: 'undefined' },
      },
    },
    className: {
      description:
        'Classes applied to the root container. Use `publish-colors` with `bg-*` for proper fade colors.',
    },
    viewportClassName: {
      description:
        'Classes applied to the scrollable viewport element. Useful for additional styling.',
    },
  },
};

export default meta;
type Story = StoryObj<ScrollAreaProps>;

const VerticalContent = () => (
  <div className="flex flex-col gap-4 p-4">
    {Array.from({ length: 20 }, (_, i) => (
      <div
        key={i}
        className={cx('border p-4', 'bg-surface-1 text-surface-1-contrast')}
      >
        <h4 className="font-medium">Item {i + 1}</h4>
        <p className="text-sm opacity-70">
          This is some content for item {i + 1}. It demonstrates vertical
          scrolling.
        </p>
      </div>
    ))}
  </div>
);

const HorizontalContent = () => (
  <div className="flex gap-4 p-4">
    {Array.from({ length: 15 }, (_, i) => (
      <div
        key={i}
        className={cx(
          'flex-shrink-0 border p-4',
          'bg-surface-1 text-surface-1-contrast',
          'w-48',
        )}
      >
        <h4 className="font-medium">Card {i + 1}</h4>
        <p className="text-sm opacity-70">Horizontal scroll content</p>
      </div>
    ))}
  </div>
);

const BothContent = () => (
  <div className="flex flex-col gap-4 p-4">
    {Array.from({ length: 15 }, (_, rowIndex) => (
      <div key={rowIndex} className="flex gap-4">
        {Array.from({ length: 10 }, (_, colIndex) => (
          <div
            key={colIndex}
            className={cx(
              'shrink-0 border p-4',
              'bg-surface-1 text-surface-1-contrast',
              'w-40',
            )}
          >
            <h4 className="text-sm font-medium">
              Cell {rowIndex + 1},{colIndex + 1}
            </h4>
          </div>
        ))}
      </div>
    ))}
  </div>
);

export const Default: Story = {
  args: {
    fade: true,
  },
  render: (args) => (
    <ScrollArea
      {...args}
      className="bg-background publish-colors h-80 w-96 border"
    >
      <VerticalContent />
    </ScrollArea>
  ),
};

export const Vertical: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Standard vertical scrolling. Content overflows vertically.',
      },
    },
  },
  render: () => (
    <ScrollArea className="bg-background publish-colors h-80 w-96 border">
      <VerticalContent />
    </ScrollArea>
  ),
};

export const Horizontal: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          'Horizontal scrolling for content like carousels or wide tables.',
      },
    },
  },
  render: () => (
    <ScrollArea className="bg-background publish-colors h-40 w-96 border">
      <HorizontalContent />
    </ScrollArea>
  ),
};

export const Both: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          'Bidirectional scrolling for content that overflows in both directions, such as large data grids.',
      },
    },
  },
  render: () => (
    <ScrollArea className="bg-background publish-colors h-80 w-96 border">
      <BothContent />
    </ScrollArea>
  ),
};

export const WithFade: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          'The fade effect shows gradient overlays at the scroll edges to indicate more content. Enabled by default.',
      },
    },
  },
  render: () => (
    <div className="flex h-96 gap-8">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Fade On (default)</span>
        <ScrollArea
          fade={true}
          className="bg-background publish-colors h-64 w-72 border"
        >
          <VerticalContent />
        </ScrollArea>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Fade Off</span>
        <ScrollArea
          fade={false}
          className="bg-background publish-colors h-64 w-72 border"
        >
          <VerticalContent />
        </ScrollArea>
      </div>
    </div>
  ),
};

export const Orientations: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Comparison of all three orientation options side by side.',
      },
    },
  },
  render: () => (
    <div className="flex flex-col gap-8">
      <div className="flex h-48 w-80 flex-col gap-2">
        <span className="text-sm font-medium">Vertical</span>
        <ScrollArea className="bg-background publish-colors border">
          <VerticalContent />
        </ScrollArea>
      </div>
      <div className="flex h-36 w-80 flex-col gap-2">
        <span className="text-sm font-medium">Horizontal</span>
        <ScrollArea className="bg-background publish-colors border">
          <HorizontalContent />
        </ScrollArea>
      </div>
      <div className="flex h-64 w-80 flex-col gap-2">
        <span className="text-sm font-medium">Both</span>
        <ScrollArea className="bg-background publish-colors border">
          <BothContent />
        </ScrollArea>
      </div>
    </div>
  ),
};

export const CustomViewportClass: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          'Use `viewportClassName` to apply styles directly to the scrollable viewport element.',
      },
    },
  },
  render: () => (
    <ScrollArea
      className="bg-background publish-colors h-64 w-80 border"
      viewportClassName="bg-surface-2"
    >
      <VerticalContent />
    </ScrollArea>
  ),
};

const SnapVerticalContent = () => (
  <div className="flex flex-col gap-4 p-4">
    {Array.from({ length: 10 }, (_, i) => (
      <div
        key={i}
        className={cx(
          'snap-start border p-6',
          'bg-surface-1 text-surface-1-contrast',
          'min-h-32',
        )}
      >
        <h4 className="text-lg font-medium">Snap Item {i + 1}</h4>
        <p className="text-sm opacity-70">
          This item will snap to the top when scrolling. Try scrolling slowly to
          see the snap effect.
        </p>
      </div>
    ))}
  </div>
);

const SnapHorizontalContent = () => (
  <div className="flex gap-4 p-4">
    {Array.from({ length: 12 }, (_, i) => (
      <div
        key={i}
        className={cx(
          'shrink-0 snap-center border p-4',
          'bg-surface-1 text-surface-1-contrast',
          'flex h-32 w-56 flex-col items-center justify-center',
        )}
      >
        <h4 className="text-lg font-medium">Card {i + 1}</h4>
        <p className="text-sm opacity-70">Snaps to center</p>
      </div>
    ))}
  </div>
);

export const ScrollSnapVertical: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: `Vertical scroll snapping. Items use \`snap-start\` to snap to the top of the viewport.

- **Mandatory**: Always snaps to the nearest item, even with small scroll movements
- **Proximity**: Only snaps when the scroll position is close to a snap point`,
      },
    },
  },
  render: () => (
    <div className="flex gap-8">
      <div className="flex h-96 flex-col gap-2">
        <span className="text-sm font-medium">Mandatory (snaps always)</span>
        <ScrollArea
          snap="mandatory"
          className="publish-colors bg-background w-80 border"
        >
          <SnapVerticalContent />
        </ScrollArea>
      </div>
      <div className="flex h-96 flex-col gap-2">
        <span className="text-sm font-medium">
          Proximity (snaps when close)
        </span>
        <ScrollArea
          snap="proximity"
          className="publish-colors bg-background w-80 border"
        >
          <SnapVerticalContent />
        </ScrollArea>
      </div>
    </div>
  ),
};

export const ScrollSnapHorizontal: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          'Horizontal scroll snapping with items using `snap-center` to snap to the center of the viewport. Useful for carousels and image galleries.',
      },
    },
  },
  render: () => (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">
          Horizontal Snap (center, mandatory)
        </span>
        <ScrollArea
          snap="mandatory"
          className="bg-background publish-colors h-44 w-96 border"
        >
          <SnapHorizontalContent />
        </ScrollArea>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">
          Horizontal Snap (center, proximity)
        </span>
        <ScrollArea
          snap="proximity"
          className="bg-background publish-colors h-44 w-96 border"
        >
          <SnapHorizontalContent />
        </ScrollArea>
      </div>
    </div>
  ),
};

export const FadeWithDifferentBackgrounds: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: `The fade gradient automatically adapts to match the ScrollArea's background color.

Use \`publish-colors\` with any \`bg-*\` class on the ScrollArea's \`className\` to set both the background and the fade color. This works with theme colors (\`bg-surface-1\`, \`bg-accent\`) and arbitrary colors (\`bg-[#ff7f50]\`).`,
      },
    },
  },
  render: () => (
    <div className="flex flex-wrap gap-6">
      <div className="flex h-96 flex-col gap-2">
        <span className="text-sm font-medium">Default (--background)</span>
        <ScrollArea
          fade={true}
          className="publish-colors bg-background w-64 border"
        >
          <VerticalContent />
        </ScrollArea>
      </div>
      <div className="flex h-96 flex-col gap-2">
        <span className="text-sm font-medium">Surface 1</span>
        <ScrollArea
          fade={true}
          className="publish-colors bg-surface-1 w-64 border"
        >
          <VerticalContent />
        </ScrollArea>
      </div>
      <div className="flex h-96 flex-col gap-2">
        <span className="text-sm font-medium">Surface 2</span>
        <ScrollArea
          fade={true}
          className="publish-colors bg-surface-2 w-64 border"
        >
          <VerticalContent />
        </ScrollArea>
      </div>
      <div className="flex h-96 flex-col gap-2">
        <span className="text-sm font-medium">Accent</span>
        <ScrollArea
          fade={true}
          className="publish-colors bg-accent w-64 border"
        >
          <VerticalContent />
        </ScrollArea>
      </div>
      <div className="flex h-96 flex-col gap-2">
        <span className="text-sm font-medium">Custom Color (coral)</span>
        <ScrollArea
          fade={true}
          className="publish-colors w-64 border bg-[#ff7f50]"
        >
          <VerticalContent />
        </ScrollArea>
      </div>
      <div className="flex h-96 flex-col gap-2">
        <span className="text-sm font-medium">Custom Color (slate)</span>
        <ScrollArea
          fade={true}
          className="publish-colors w-64 border bg-[#334155]"
        >
          <VerticalContent />
        </ScrollArea>
      </div>
    </div>
  ),
};
