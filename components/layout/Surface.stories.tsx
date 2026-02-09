import type { Meta, StoryFn } from '@storybook/nextjs-vite';
import { type ElementType } from 'react';
import { Button } from '../ui/Button';
import Surface, { MotionSurface, type SurfaceVariants } from './Surface';

// Define the metadata for the Storybook
const meta: Meta<typeof Surface> = {
  title: 'UI/Surface',
  component: Surface,
  argTypes: {
    level: {
      control: {
        type: 'select',
        options: [0, 1, 2, 3, 'popover'],
      },
      description: 'Defines the background and foreground levels.',
      defaultValue: 1,
    },
    spacing: {
      control: {
        type: 'select',
        options: ['none', 'xs', 'sm', 'md', 'lg', 'xl'],
      },
      description: 'Defines the padding inside the Surface.',
      defaultValue: 'md',
    },
    as: {
      control: {
        type: 'select',
        options: ['div', 'section', 'article', 'main', 'header', 'footer'],
      },
      description: 'HTML element to render as.',
      defaultValue: 'div',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes.',
    },
    id: {
      control: 'text',
      description: 'HTML id attribute.',
    },
    role: {
      control: 'text',
      description: 'ARIA role attribute.',
    },
    children: {
      control: 'text',
      description: 'Content inside the Surface.',
    },
  },
  tags: ['autodocs'],
} as Meta<typeof Surface>;

export default meta;

// Surface with Different Levels
export const DifferentLevels: StoryFn<typeof Surface> = () => (
  <div className="space-y-4">
    {[0, 1, 2, 3, 'popover'].map((level) => (
      <Surface
        key={level}
        level={level as SurfaceVariants['level']}
        spacing="md"
        className="flex items-center gap-10"
      >
        Surface Level {level}
        <Button color="default">Default Button</Button>
      </Surface>
    ))}
  </div>
);

// Surface with Different Spacing
export const DifferentSpacing: StoryFn<typeof Surface> = () => (
  <div className="space-y-4">
    {['none', 'xs', 'sm', 'md', 'lg', 'xl'].map((spacing) => (
      <Surface
        key={spacing}
        level={1}
        spacing={spacing as SurfaceVariants['spacing']}
      >
        Surface with {spacing} spacing
      </Surface>
    ))}
  </div>
);

// Surface as Different HTML Elements
export const AsDifferentElements: StoryFn<typeof Surface> = () => (
  <div className="space-y-4">
    {['div', 'section', 'article', 'main', 'header', 'footer'].map(
      (element) => (
        <Surface
          key={element}
          as={element as ElementType}
          level={1}
          spacing="md"
        >
          Surface as &lt;{element}&gt; element
        </Surface>
      ),
    )}
  </div>
);

// Surface with Additional Class Names
export const WithAdditionalClassName: StoryFn<typeof Surface> = () => (
  <Surface level={1} spacing="md" className="border-destructive border-2">
    Surface with additional border classes
  </Surface>
);

// MotionSurface Story with Animation
export const MotionSurfaceExample: StoryFn<typeof Surface> = () => (
  <MotionSurface
    level={2}
    spacing="lg"
    initial={{ opacity: 0, y: -50 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    Animated MotionSurface Component
  </MotionSurface>
);

// **New Story: Nested Surfaces**
export const NestedSurfaces: StoryFn<typeof Surface> = () => (
  <div className="bg-background text-text @container p-10">
    Background
    <Button color="default">Default Button</Button>
    <Surface level={0} className="mt-4 flex flex-col space-y-4">
      This is Surface Level 0<Button color="default">Default Button</Button>
      <Surface level={1} className="mt-4 flex flex-col space-y-4">
        This is Surface Level 1<Button color="default">Default Button</Button>
        <Surface level={2} className="mt-4 flex flex-col space-y-4">
          This is Surface Level 2<Button color="default">Default Button</Button>
          <Surface level={3} className="mt-4 flex flex-col space-y-4">
            This is Surface Level 3
            <Button color="default">Default Button</Button>
            <Surface level="popover" className="mt-4 flex flex-col space-y-4">
              This is Surface Level Popover
              <Button color="default">Default Button</Button>
            </Surface>
          </Surface>
        </Surface>
      </Surface>
    </Surface>
  </div>
);
