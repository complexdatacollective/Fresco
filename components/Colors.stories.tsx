import type { Meta, StoryObj } from '@storybook/nextjs-vite';

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
        <h2 className="mb-4 text-2xl font-bold">Semantic Colors</h2>
        <p className="text-text/70 mb-6 text-sm">
          Core brand and semantic colors used throughout the application
        </p>
        <div className="tablet:grid-cols-4 grid grid-cols-2 gap-6">
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
        <h2 className="mb-4 text-2xl font-bold">Status Colors</h2>
        <p className="text-text/70 mb-6 text-sm">
          Colors for indicating status, alerts, and user feedback
        </p>
        <div className="tablet:grid-cols-4 grid grid-cols-2 gap-6">
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
        <h2 className="mb-4 text-2xl font-bold">Base Colors</h2>
        <p className="text-text/70 mb-6 text-sm">
          Foundation colors for backgrounds, surfaces, and text
        </p>
        <div className="tablet:grid-cols-4 grid grid-cols-2 gap-6">
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
        <h2 className="mb-4 text-2xl font-bold">Surface Levels</h2>
        <p className="text-text/70 mb-6 text-sm">
          Layered surfaces for depth and hierarchy
        </p>
        <div className="tablet:grid-cols-4 grid grid-cols-2 gap-6">
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
        <h2 className="mb-4 text-2xl font-bold">Interactive Colors</h2>
        <p className="text-text/70 mb-6 text-sm">
          Colors for interactive elements and inputs
        </p>
        <div className="tablet:grid-cols-4 grid grid-cols-2 gap-6">
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
          <ColorSwatch name="Ring" cssVar="--ring" />
        </div>
      </div>
    </div>
  ),
};

export const NodeColors: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h2 className="mb-4 text-2xl font-bold">Node Colors</h2>
        <p className="text-text/70 mb-6 text-sm">
          Sequential colors for network nodes (1-8)
        </p>
        <div className="tablet:grid-cols-4 grid grid-cols-2 gap-6">
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
        <h2 className="mb-4 text-2xl font-bold">Edge Colors</h2>
        <p className="text-text/70 mb-6 text-sm">
          Sequential colors for network edges (1-10)
        </p>
        <div className="tablet:grid-cols-4 laptop:grid-cols-5 grid grid-cols-2 gap-6">
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
        <h2 className="mb-4 text-2xl font-bold">Ordinal Colors</h2>
        <p className="text-text/70 mb-6 text-sm">Ordinal scale colors (1-8)</p>
        <div className="tablet:grid-cols-4 grid grid-cols-2 gap-6">
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
        <h2 className="mb-4 text-2xl font-bold">Categorical Colors</h2>
        <p className="text-text/70 mb-6 text-sm">
          Categorical colors for groups and convex hulls (1-10)
        </p>
        <div className="tablet:grid-cols-4 laptop:grid-cols-5 grid grid-cols-2 gap-6">
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
        <h1 className="mb-2 text-3xl font-bold">Complete Color System</h1>
        <p className="text-text/70 mb-8">
          All colors available in the Fresco design system
        </p>
      </div>

      <div>
        <h2 className="mb-4 text-2xl font-bold">Semantic Colors</h2>
        <div className="tablet:grid-cols-4 grid grid-cols-2 gap-4">
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
        <h2 className="mb-4 text-2xl font-bold">Node Sequence</h2>
        <div className="tablet:grid-cols-4 grid grid-cols-2 gap-4">
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
        <h2 className="mb-4 text-2xl font-bold">Edge Sequence</h2>
        <div className="tablet:grid-cols-4 laptop:grid-cols-5 grid grid-cols-2 gap-4">
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
        <h2 className="mb-4 text-2xl font-bold">Ordinal & Categorical</h2>
        <div className="tablet:grid-cols-4 grid grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
            <ColorSwatch
              key={num}
              name={`Ord ${num}`}
              cssVar={`--ord-${num}`}
            />
          ))}
        </div>
        <div className="tablet:grid-cols-4 laptop:grid-cols-5 mt-4 grid grid-cols-2 gap-4">
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
