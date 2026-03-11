import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';

const ColorSwatch = ({
  name,
  cssVar,
  contrastVar,
}: {
  name: string;
  cssVar: string;
  contrastVar?: string;
}) => (
  <div className="flex flex-col gap-2">
    <div
      className="border-outline flex h-24 w-full items-center justify-center rounded-lg border-2 font-medium"
      style={{
        backgroundColor: `var(${cssVar})`,
        color: contrastVar ? `var(${contrastVar})` : 'inherit',
      }}
    >
      {name}
    </div>
    <div className="text-text/70 text-center text-xs">
      <div className="font-[monospace]">{cssVar}</div>
      {contrastVar && (
        <div className="font-[monospace] text-[10px]">{contrastVar}</div>
      )}
    </div>
  </div>
);

const meta = {
  title: 'Design System/Colors',
  parameters: {
    layout: 'padded',
    a11y: { disable: true },
  },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const SemanticColors: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <Heading level="h2" margin="none" className="mb-4">
          Semantic Colors
        </Heading>
        <Paragraph margin="none" className="text-text/70 mb-6 text-sm">
          Core brand and semantic colors used throughout the application
        </Paragraph>
        <div className="tablet-landscape:grid-cols-4 grid grid-cols-2 gap-6">
          <ColorSwatch
            name="Primary"
            cssVar="--color-primary"
            contrastVar="--color-primary-contrast"
          />
          <ColorSwatch
            name="Secondary"
            cssVar="--color-secondary"
            contrastVar="--color-secondary-contrast"
          />
          <ColorSwatch
            name="Accent"
            cssVar="--color-accent"
            contrastVar="--color-accent-contrast"
          />
          <ColorSwatch
            name="Neutral"
            cssVar="--color-neutral"
            contrastVar="--color-neutral-contrast"
          />
        </div>
      </div>

      <div>
        <Heading level="h2" margin="none" className="mb-4">
          Status Colors
        </Heading>
        <Paragraph margin="none" className="text-text/70 mb-6 text-sm">
          Colors for indicating status, alerts, and user feedback
        </Paragraph>
        <div className="tablet-landscape:grid-cols-4 grid grid-cols-2 gap-6">
          <ColorSwatch
            name="Success"
            cssVar="--color-success"
            contrastVar="--color-success-contrast"
          />
          <ColorSwatch
            name="Info"
            cssVar="--color-info"
            contrastVar="--color-info-contrast"
          />
          <ColorSwatch
            name="Warning"
            cssVar="--color-warning"
            contrastVar="--color-warning-contrast"
          />
          <ColorSwatch
            name="Destructive"
            cssVar="--color-destructive"
            contrastVar="--color-destructive-contrast"
          />
        </div>
      </div>

      <div>
        <Heading level="h2" margin="none" className="mb-4">
          Base Colors
        </Heading>
        <Paragraph margin="none" className="text-text/70 mb-6 text-sm">
          Foundation colors for backgrounds, surfaces, and text
        </Paragraph>
        <div className="tablet-landscape:grid-cols-4 grid grid-cols-2 gap-6">
          <ColorSwatch name="Background" cssVar="--background" />
          <ColorSwatch name="Text" cssVar="--text" contrastVar="--neutral" />
          <ColorSwatch
            name="Surface"
            cssVar="--surface"
            contrastVar="--surface-contrast"
          />
          <ColorSwatch name="Outline" cssVar="--outline" />
        </div>
      </div>

      <div>
        <Heading level="h2" margin="none" className="mb-4">
          Surface Levels
        </Heading>
        <Paragraph margin="none" className="text-text/70 mb-6 text-sm">
          Layered surfaces for depth and hierarchy
        </Paragraph>
        <div className="tablet-landscape:grid-cols-4 grid grid-cols-2 gap-6">
          <ColorSwatch name="Surface" cssVar="--surface" />
          <ColorSwatch name="Surface 1" cssVar="--surface-1" />
          <ColorSwatch name="Surface 2" cssVar="--surface-2" />
          <ColorSwatch name="Surface 3" cssVar="--surface-3" />
          <ColorSwatch
            name="Popover"
            cssVar="--surface-popover"
            contrastVar="--surface-popover-contrast"
          />
        </div>
      </div>

      <div>
        <Heading level="h2" margin="none" className="mb-4">
          Interactive Colors
        </Heading>
        <Paragraph margin="none" className="text-text/70 mb-6 text-sm">
          Colors for interactive elements and inputs
        </Paragraph>
        <div className="tablet-landscape:grid-cols-4 grid grid-cols-2 gap-6">
          <ColorSwatch
            name="Input"
            cssVar="--input"
            contrastVar="--input-contrast"
          />
          <ColorSwatch
            name="Selected"
            cssVar="--selected"
            contrastVar="--selected-contrast"
          />
          <ColorSwatch name="Link" cssVar="--link" />
        </div>
      </div>
    </div>
  ),
};

export const NodeColors: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <Heading level="h2" margin="none" className="mb-4">
          Node Colors
        </Heading>
        <Paragraph margin="none" className="text-text/70 mb-6 text-sm">
          Sequential colors for network nodes (1-8)
        </Paragraph>
        <div className="tablet-landscape:grid-cols-4 grid grid-cols-2 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
            <ColorSwatch
              key={num}
              name={`Node ${num}`}
              cssVar={`--node-${num}`}
              contrastVar={`--node-${num}-contrast`}
            />
          ))}
        </div>
      </div>
    </div>
  ),
};

export const EdgeColors: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <Heading level="h2" margin="none" className="mb-4">
          Edge Colors
        </Heading>
        <Paragraph margin="none" className="text-text/70 mb-6 text-sm">
          Sequential colors for network edges (1-10)
        </Paragraph>
        <div className="tablet-landscape:grid-cols-4 laptop:grid-cols-5 grid grid-cols-2 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
            <ColorSwatch
              key={num}
              name={`Edge ${num}`}
              cssVar={`--edge-${num}`}
              contrastVar="--neutral"
            />
          ))}
        </div>
      </div>
    </div>
  ),
};

export const OrdinalColors: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <Heading level="h2" margin="none" className="mb-4">
          Ordinal Colors
        </Heading>
        <Paragraph margin="none" className="text-text/70 mb-6 text-sm">
          Ordinal scale colors (1-8)
        </Paragraph>
        <div className="tablet-landscape:grid-cols-4 grid grid-cols-2 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
            <ColorSwatch
              key={num}
              name={`Ordinal ${num}`}
              cssVar={`--ord-${num}`}
            />
          ))}
        </div>
      </div>
    </div>
  ),
};

export const CategoricalColors: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <Heading level="h2" margin="none" className="mb-4">
          Categorical Colors
        </Heading>
        <Paragraph margin="none" className="text-text/70 mb-6 text-sm">
          Categorical colors for groups and convex hulls (1-10)
        </Paragraph>
        <div className="tablet-landscape:grid-cols-4 laptop:grid-cols-5 grid grid-cols-2 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
            <ColorSwatch
              key={num}
              name={`Category ${num}`}
              cssVar={`--cat-${num}`}
            />
          ))}
        </div>
      </div>
    </div>
  ),
};

export const AllColors: Story = {
  render: () => (
    <div className="space-y-12">
      <div>
        <Heading level="h1" margin="none" className="mb-2">
          Complete Color System
        </Heading>
        <Paragraph margin="none" className="text-text/70 mb-8">
          All colors available in the Fresco design system
        </Paragraph>
      </div>

      <div>
        <Heading level="h2" margin="none" className="mb-4">
          Semantic Colors
        </Heading>
        <div className="tablet-landscape:grid-cols-4 grid grid-cols-2 gap-4">
          <ColorSwatch
            name="Primary"
            cssVar="--color-primary"
            contrastVar="--color-primary-contrast"
          />
          <ColorSwatch
            name="Secondary"
            cssVar="--color-secondary"
            contrastVar="--color-secondary-contrast"
          />
          <ColorSwatch
            name="Accent"
            cssVar="--color-accent"
            contrastVar="--color-accent-contrast"
          />
          <ColorSwatch
            name="Neutral"
            cssVar="--color-neutral"
            contrastVar="--color-neutral-contrast"
          />
          <ColorSwatch
            name="Success"
            cssVar="--color-success"
            contrastVar="--color-success-contrast"
          />
          <ColorSwatch
            name="Info"
            cssVar="--color-info"
            contrastVar="--color-info-contrast"
          />
          <ColorSwatch
            name="Warning"
            cssVar="--color-warning"
            contrastVar="--color-warning-contrast"
          />
          <ColorSwatch
            name="Destructive"
            cssVar="--color-destructive"
            contrastVar="--color-destructive-contrast"
          />
        </div>
      </div>

      <div>
        <Heading level="h2" margin="none" className="mb-4">
          Node Sequence
        </Heading>
        <div className="tablet-landscape:grid-cols-4 grid grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
            <ColorSwatch
              key={num}
              name={`Node ${num}`}
              cssVar={`--node-${num}`}
              contrastVar={`--node-${num}-contrast`}
            />
          ))}
        </div>
      </div>

      <div>
        <Heading level="h2" margin="none" className="mb-4">
          Edge Sequence
        </Heading>
        <div className="tablet-landscape:grid-cols-4 laptop:grid-cols-5 grid grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
            <ColorSwatch
              key={num}
              name={`Edge ${num}`}
              cssVar={`--edge-${num}`}
            />
          ))}
        </div>
      </div>

      <div>
        <Heading level="h2" margin="none" className="mb-4">
          Ordinal & Categorical
        </Heading>
        <div className="tablet-landscape:grid-cols-4 grid grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
            <ColorSwatch
              key={num}
              name={`Ord ${num}`}
              cssVar={`--ord-${num}`}
            />
          ))}
        </div>
        <div className="tablet-landscape:grid-cols-4 laptop:grid-cols-5 mt-4 grid grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
            <ColorSwatch
              key={num}
              name={`Cat ${num}`}
              cssVar={`--cat-${num}`}
            />
          ))}
        </div>
      </div>
    </div>
  ),
};
