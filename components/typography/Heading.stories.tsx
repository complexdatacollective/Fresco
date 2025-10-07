import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import Heading from './Heading';

const meta = {
  title: 'Systems/Typography/Heading',
  component: Heading,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    level: {
      control: 'select',
      options: ['h1', 'h2', 'h3', 'h4'],
      description: 'The heading level, which determines the text size',
    },
    variant: {
      control: 'select',
      options: ['default', 'all-caps', 'page-heading'],
      description: 'Visual variant of the heading',
    },
    margin: {
      control: 'select',
      options: ['default', 'none'],
      description: 'Margin behavior for the heading',
    },
    asChild: {
      control: 'boolean',
      description: 'Use Radix Slot for composition',
    },
  },
} satisfies Meta<typeof Heading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    level: 'h2',
    children: 'Default Heading',
  },
};

export const Levels: Story = {
  render: () => (
    <div className="space-y-6">
      <Heading level="h1">Heading Level 1 (text-3xl)</Heading>
      <Heading level="h2">Heading Level 2 (text-2xl)</Heading>
      <Heading level="h3">Heading Level 3 (text-xl)</Heading>
      <Heading level="h4">Heading Level 4 (text-lg)</Heading>
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <div className="mb-2 text-xs">default</div>
        <Heading level="h2" variant="default">
          Default heading style
        </Heading>
      </div>
      <div>
        <div className="mb-2 text-xs">all-caps</div>
        <Heading level="h2" variant="all-caps">
          All Caps Heading Style
        </Heading>
      </div>
      <div>
        <div className="mb-2 text-xs">page-heading</div>
        <Heading level="h1" variant="page-heading">
          Page Heading (text-4xl)
        </Heading>
      </div>
    </div>
  ),
};

export const Margins: Story = {
  render: () => (
    <div className="space-y-8">
      <div className="border-accent/20 rounded-lg border p-4">
        <p className="text-sm">Default margin (not-first:mt-4)</p>
        <p className="mt-2 text-sm">Some content before...</p>
        <Heading level="h3" margin="default">
          This heading has default margin
        </Heading>
        <p className="text-sm">Content after the heading</p>
      </div>

      <div className="border-accent/20 rounded-lg border p-4">
        <p className="text-sm">No margin</p>
        <p className="mt-2 text-sm">Some content before...</p>
        <Heading level="h3" margin="none">
          This heading has no margin
        </Heading>
        <p className="text-sm">Content after the heading</p>
      </div>
    </div>
  ),
};

export const LevelCombinations: Story = {
  render: () => (
    <div className="space-y-10">
      <div>
        <Heading level="h1">Main Page Title</Heading>
        <p className="mt-4 text-base">
          This is the primary heading for the page using h1 level (text-3xl).
        </p>
      </div>

      <div>
        <Heading level="h2">Section Heading</Heading>
        <p className="mt-4 text-base">
          Section headings use h2 level (text-2xl) to organize major sections.
        </p>
        <Heading level="h3">Subsection Heading</Heading>
        <p className="mt-4 text-base">
          Subsections use h3 level (text-xl) for nested content.
        </p>
        <Heading level="h4">Minor Heading</Heading>
        <p className="mt-4 text-base">
          Minor headings use h4 level (text-lg) for the smallest divisions.
        </p>
      </div>
    </div>
  ),
};

export const AsChildPattern: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-xs">Using asChild to render as a link</p>
        <Heading level="h2" asChild>
          <a href="#" className="hover:underline">
            Clickable Heading Link
          </a>
        </Heading>
      </div>
      <div>
        <p className="mb-2 text-xs">Using custom element with as prop</p>
        <Heading level="h2" as="div">
          Non-semantic heading (div)
        </Heading>
      </div>
    </div>
  ),
};

export const LongHeadings: Story = {
  render: () => (
    <div className="max-w-2xl space-y-8">
      <Heading level="h1">
        This is a very long heading that demonstrates how text-balance works to
        create more aesthetically pleasing line breaks
      </Heading>
      <Heading level="h2">
        Another long heading showing the text balance behavior across multiple
        lines of text
      </Heading>
      <div className="bg-info/10 rounded-lg p-4 text-sm">
        <strong>Note:</strong> The <code>text-balance</code> utility is applied
        to all headings to create more balanced, readable line wrapping.
      </div>
    </div>
  ),
};

export const ResponsiveBehavior: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="bg-warning/10 rounded-lg p-4">
        <p className="text-sm">
          💡 Tip: Resize your browser to see headings scale
        </p>
        <p className="mt-2 text-xs">
          Headings use the fluid type scale system that adjusts based on
          viewport size. The scale ratio increases on larger screens for better
          visual hierarchy.
        </p>
      </div>
      <Heading level="h1" variant="page-heading">
        Responsive Page Heading
      </Heading>
      <Heading level="h2">Responsive Section Heading</Heading>
      <Heading level="h3">Responsive Subsection Heading</Heading>
    </div>
  ),
};
