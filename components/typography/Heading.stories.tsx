import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import Heading from './Heading';
import Paragraph from './Paragraph';

const meta = {
  title: 'Design System/Typography/Heading',
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
    <div className="">
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

export const LevelCombinations: Story = {
  render: () => (
    <div className="">
      <Heading level="h1">Main Page Title</Heading>
      <Paragraph>
        This is the primary heading for the page using h1 level (text-3xl).
      </Paragraph>

      <Heading level="h2">Section Heading</Heading>
      <Paragraph>
        Section headings use h2 level (text-2xl) to organize major sections.
      </Paragraph>
      <Heading level="h3">Subsection Heading</Heading>
      <Paragraph>
        Subsections use h3 level (text-xl) for nested content.
      </Paragraph>
      <Heading level="h4">Minor Heading</Heading>
      <Paragraph>
        Minor headings use h4 level (text-lg) for the smallest divisions.
      </Paragraph>
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
