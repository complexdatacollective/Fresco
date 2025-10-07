import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import Heading from './Heading';
import Paragraph from './Paragraph';

const TypeScaleDemo = () => (
  <div className="p-8">
    <h2 className="text-xl">Type Scale System</h2>
    <p className="text-sm">
      This type scale uses a fluid system that changes the scale ratio based on
      viewport size. Resize your browser to see the changes. Mobile uses a Minor
      Third (1.2) scale, while desktop uses a Perfect Fourth (1.333) scale for
      better readability.
    </p>
    <h3 className="mt-4 text-lg">Dynamic Properties</h3>
    <p className="mt-2 text-sm">
      Each text size includes automatically calculated properties that adjust
      with viewport size:
    </p>

    <ul className="mt-4 list-inside list-disc text-sm">
      <li>
        <strong>Font Size:</strong> Scales using the viewport-specific ratio
      </li>
      <li>
        <strong>Line Height:</strong> Decreases for larger text, increases for
        smaller text
      </li>
      <li>
        <strong>Letter Spacing:</strong> Tighter tracking for larger text,
        looser for smaller text
      </li>
      <li>
        <strong>Font Weight:</strong> Switches to display weight (700) at
        text-2xl and above
      </li>
    </ul>

    <hr className="my-6" />
    <section className="mt-8">
      <div>
        <div className="text-xs">text-xs</div>
        <div className="text-xs">
          The quick brown fox jumps over the lazy dog
        </div>
      </div>

      <div className="mt-6">
        <div className="text-xs">text-sm</div>
        <div className="text-sm">
          The quick brown fox jumps over the lazy dog
        </div>
      </div>

      <div className="mt-6">
        <div className="text-xs">text-base (default)</div>
        <div className="text-base">
          The quick brown fox jumps over the lazy dog
        </div>
      </div>

      <div className="mt-6">
        <div className="text-xs">text-lg</div>
        <div className="text-lg">
          The quick brown fox jumps over the lazy dog
        </div>
      </div>

      <div className="mt-6">
        <div className="text-xs">text-xl</div>
        <div className="text-xl">
          The quick brown fox jumps over the lazy dog
        </div>
      </div>

      <div className="mt-6">
        <div className="text-xs">text-2xl</div>
        <div className="text-2xl">
          The quick brown fox jumps over the lazy dog
        </div>
      </div>

      <div className="mt-6">
        <div className="text-xs">text-3xl</div>
        <div className="text-3xl">
          The quick brown fox jumps over the lazy dog
        </div>
      </div>

      <div className="mt-6">
        <div className="text-xs">text-4xl</div>
        <div className="text-4xl">
          The quick brown fox jumps over the lazy dog
        </div>
      </div>
    </section>
  </div>
);

const meta = {
  title: 'Systems/Typography/Type Scale',
  component: TypeScaleDemo,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A fluid type scale system that adapts to viewport size. The scale uses different ratios and line heights for optimal readability across devices.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TypeScaleDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  render: () => <TypeScaleDemo />,
};

export const TypicalPageLayout: Story = {
  render: () => (
    <div className="p-8">
      <div className="bg-info/10 rounded-lg p-4 text-sm">
        Example: This demonstrates a typical content page using all heading
        levels in a hierarchical structure. Notice how each level creates clear
        visual distinction while maintaining harmony.
      </div>

      {/* Page Title - 4xl */}
      <Heading level="h1" variant="page-heading">
        Building Scalable Design Systems
      </Heading>
      <Paragraph intent="lead">
        A comprehensive guide to creating flexible, maintainable design systems
        that scale across teams and products
      </Paragraph>

      <Heading level="h1"> The Importance of a Type System</Heading>
      <Paragraph>
        A well-designed type system is the foundation of any successful design
        system. It establishes visual hierarchy, improves readability, and
        ensures consistency across all touchpoints. By using a mathematical
        scale, we can create harmonious relationships between different text
        sizes.
      </Paragraph>

      {/* Another subsection - 2xl */}

      <Heading level="h2">Responsive Typography Benefits</Heading>
      <Paragraph>
        Responsive type systems adapt not just size, but also line height,
        letter spacing, and even font weight to create optimal reading
        experiences across devices.
      </Paragraph>

      <Heading level="h3">Improved Readability</Heading>
      <Paragraph>
        By adjusting line height and letter spacing based on viewport size, text
        remains comfortable to read whether on a small phone screen or a large
        desktop monitor.
      </Paragraph>

      <Heading level="h3">Visual Hierarchy</Heading>
      <Paragraph>
        The varying scale ratios ensure that headings stand out appropriately at
        every screen size, maintaining clear information architecture.
      </Paragraph>

      <Heading level="h3">Developer Experience</Heading>
      <Paragraph>
        Using CSS custom properties and Tailwind utilities makes it simple for
        developers to implement consistent typography without manual
        calculations.
      </Paragraph>
    </div>
  ),
};
