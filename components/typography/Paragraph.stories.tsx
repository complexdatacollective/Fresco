import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import Heading from './Heading';
import Paragraph from './Paragraph';

const meta = {
  title: 'UI/Typography/Paragraph',
  component: Paragraph,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    intent: {
      control: 'select',
      options: ['default', 'blockquote', 'inlineCode', 'lead', 'smallText'],
      description: 'The visual intent/style of the paragraph',
    },
    emphasis: {
      control: 'select',
      options: ['default', 'muted'],
      description: 'Text emphasis level',
    },
    margin: {
      control: 'select',
      options: ['default', 'none'],
      description: 'Margin behavior for the paragraph',
    },
  },
} satisfies Meta<typeof Paragraph>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children:
      'This is a default paragraph. It uses text-pretty for optimal line breaking and maintains good readability across different viewport sizes.',
  },
};

export const Intents: Story = {
  render: () => (
    <div className="max-w-2xl space-y-8">
      <div>
        <div className="mb-2 text-xs">default</div>
        <Paragraph intent="default">
          This is the default paragraph style. It uses text-pretty for optimal
          text wrapping and maintains consistent spacing. Lorem ipsum dolor sit
          amet, consectetur adipiscing elit.
        </Paragraph>
      </div>

      <div>
        <div className="mb-2 text-xs">lead</div>
        <Paragraph intent="lead">
          This is a lead paragraph, typically used for introductory text.
          It&apos;s slightly larger and has bottom margin for emphasis.
        </Paragraph>
      </div>

      <div>
        <div className="mb-2 text-xs">smallText</div>
        <Paragraph intent="smallText">
          This is small text, useful for captions, footnotes, or supplementary
          information. It uses the text-sm size from the type scale.
        </Paragraph>
      </div>

      <div>
        <div className="mb-2 text-xs">blockquote</div>
        <Paragraph intent="blockquote">
          This is a blockquote style paragraph. It includes a left border,
          padding, and italic text to distinguish quoted content from regular
          text.
        </Paragraph>
      </div>

      <div>
        <div className="mb-2 text-xs">inlineCode</div>
        <Paragraph>
          You can use{' '}
          <Paragraph intent="inlineCode" className="inline">
            inline code
          </Paragraph>{' '}
          within your text for technical references.
        </Paragraph>
      </div>
    </div>
  ),
};

export const Emphasis: Story = {
  render: () => (
    <div className="max-w-2xl space-y-6">
      <div>
        <div className="mb-2 text-xs">default</div>
        <Paragraph emphasis="default">
          This paragraph uses the default text emphasis, displaying at full
          opacity with the standard text color.
        </Paragraph>
      </div>

      <div>
        <div className="mb-2 text-xs">muted</div>
        <Paragraph emphasis="muted">
          This paragraph uses muted emphasis, which is useful for secondary or
          less important information that should be visible but not prominent.
        </Paragraph>
      </div>
    </div>
  ),
};

export const Margins: Story = {
  render: () => (
    <div className="max-w-2xl space-y-8">
      <div className="border-accent/20 rounded-lg border p-4">
        <p className="text-sm">Default margin (not-first:mt-4)</p>
        <Paragraph margin="default">
          First paragraph with default margin.
        </Paragraph>
        <Paragraph margin="default">
          Second paragraph - notice the top margin applied automatically.
        </Paragraph>
        <Paragraph margin="default">
          Third paragraph - spacing is consistent between paragraphs.
        </Paragraph>
      </div>

      <div className="border-accent/20 rounded-lg border p-4">
        <p className="text-sm">No margin</p>
        <Paragraph margin="none">First paragraph with no margin.</Paragraph>
        <Paragraph margin="none">
          Second paragraph - no top margin applied.
        </Paragraph>
        <Paragraph margin="none">
          Third paragraph - all paragraphs are tightly packed.
        </Paragraph>
      </div>
    </div>
  ),
};

export const RealWorldExample: Story = {
  render: () => (
    <div className="max-w-2xl">
      <Heading level="h2">Understanding Type Systems</Heading>

      <Paragraph intent="lead">
        A well-designed type system is the foundation of effective communication
        in digital interfaces. It establishes hierarchy, improves readability,
        and creates visual harmony.
      </Paragraph>

      <Paragraph>
        Typography in user interfaces serves multiple purposes. It conveys
        information, establishes brand identity, and guides users through
        content. The choice of typeface, size, weight, and spacing all
        contribute to the overall user experience.
      </Paragraph>
      <Paragraph intent="blockquote">
        Good typography is invisible. It doesn&apos;t call attention to itself;
        it calls attention to the ideas and information it conveys.
      </Paragraph>

      <Paragraph intent="smallText" emphasis="muted">
        Note: This example demonstrates various paragraph styles working
        together in a typical content layout.
      </Paragraph>
    </div>
  ),
};

export const LongFormContent: Story = {
  render: () => (
    <div className="max-w-2xl">
      <Paragraph emphasis="muted" intent="smallText" margin="none">
        Article
      </Paragraph>
      <Heading level="h2">The History of Typography</Heading>

      <Paragraph intent="lead">
        Typography has evolved dramatically since the invention of the printing
        press in the 15th century, shaping how we communicate and share
        information.
      </Paragraph>

      <Paragraph>
        The art and technique of arranging type has been practiced for
        centuries, beginning with Gutenberg&apos;s movable type system. This
        revolutionary invention democratized knowledge by making books more
        accessible to the general public. Before this innovation, books were
        painstakingly copied by hand, making them rare and expensive commodities
        available only to the wealthy and religious institutions.
      </Paragraph>

      <Paragraph>
        As printing technology advanced, so did the craft of typography. The
        Renaissance period saw the development of Roman typefaces, characterized
        by their elegant proportions and refined serifs. These designs were
        inspired by ancient Roman inscriptions and manuscripts, creating a
        visual link between classical learning and contemporary thought.
      </Paragraph>

      <Paragraph>
        In the digital age, typography has undergone another transformation. Web
        fonts, variable fonts, and responsive design have created new
        opportunities and challenges for typographers. Today&apos;s designers
        must consider not just aesthetics, but also performance, accessibility,
        and adaptability across countless devices and screen sizes.
      </Paragraph>
    </div>
  ),
};

export const MixedContent: Story = {
  render: () => (
    <div className="max-w-2xl space-y-4">
      <Paragraph>
        Regular text can include{' '}
        <Paragraph intent="inlineCode" className="inline">
          code snippets
        </Paragraph>{' '}
        for technical documentation. You might also want to use{' '}
        <strong>bold text</strong> for emphasis or <em>italic text</em> for
        subtle stress.
      </Paragraph>

      <Paragraph intent="smallText">
        Small text is perfect for disclaimers, metadata, or supplementary
        information that supports the main content.
      </Paragraph>

      <Paragraph intent="blockquote">
        Blockquotes are ideal for highlighting important statements,
        testimonials, or quotes from external sources that deserve special
        visual treatment.
      </Paragraph>

      <Paragraph emphasis="muted">
        Muted text creates visual hierarchy by reducing emphasis, useful for
        secondary information that should remain visible but not compete with
        primary content.
      </Paragraph>
    </div>
  ),
};
