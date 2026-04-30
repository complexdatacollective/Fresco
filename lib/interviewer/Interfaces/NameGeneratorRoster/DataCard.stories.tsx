import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import Heading from '@codaco/fresco-ui/typography/Heading';
import Paragraph from '@codaco/fresco-ui/typography/Paragraph';
import DataCard from './DataCard';

const meta = {
  title: 'Interview/Interfaces/NameGeneratorRoster/DataCard',
  component: DataCard,
  parameters: {
    layout: 'padded',
    forceTheme: 'interview',
  },
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'The card title — typically the displayLabel attribute',
    },
    details: {
      control: 'object',
      description:
        'A `Record<string, VariableValue | undefined>` of label → value pairs to render as a description list below the title',
    },
  },
  args: {
    label: 'Moses Crist',
    details: {
      Age: 21,
      Location: 'New Haven',
    },
  },
} satisfies Meta<typeof DataCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The default DataCard renders a title and a small set of details. The
 * `<article aria-label>` gives the entire card a meaningful accessible
 * name and the inner `<dl>` exposes the details to screen readers as
 * label/value pairs.
 */
export const Default: Story = {
  render: (args) => (
    <div className="max-w-md">
      <DataCard {...args} />
    </div>
  ),
};

/**
 * When the protocol's cardOptions has no `additionalProperties`, the
 * card collapses to a single header. The accent bar and title styling
 * remain so the card still reads as a recognisable card rather than a
 * bare label.
 */
export const TitleOnly: Story = {
  args: {
    label: 'Moses Crist',
    details: {},
  },
  render: (args) => (
    <div className="max-w-md">
      <DataCard {...args} />
    </div>
  ),
};

/**
 * Multiple property types in the details record. `formatValue` handles
 * each `VariableValue` shape: strings, numbers, booleans (Yes/No),
 * arrays (joined), location objects (lat/lng), and missing values
 * (em dash placeholder).
 */
export const ManyDetailTypes: Story = {
  args: {
    label: 'Dr. Arthur Wintheiser',
    details: {
      'Age': 61,
      'Location': 'Bonitamouth',
      'Occupation': 'Veterinarian',
      'Years known': 12,
      'Close friend': true,
      'Lives nearby': false,
      'Hobbies': ['Hiking', 'Birdwatching', 'Pottery'],
      'Coordinates': { x: -72.9279, y: 41.3083 },
      'Notes': undefined,
    },
  },
  render: (args) => (
    <div className="max-w-lg">
      <DataCard {...args} />
    </div>
  ),
};

/**
 * Long content in the title, the labels, and the values all wraps
 * gracefully. The two-column grid (`minmax(0,1fr) minmax(0,2fr)`)
 * gives the label column at most a third of the available width and
 * the value column at most two-thirds, but lets either shrink so that
 * `wrap-break-word` can break unbreakable tokens like URLs.
 *
 * The "all information must always be displayed" requirement means
 * nothing truncates — long labels and long values both wrap onto
 * multiple lines instead of clipping with an ellipsis.
 */
export const LongContent: Story = {
  args: {
    label:
      'Professor Henrietta Maximillian-Wellington III, Esq., Director of Interdisciplinary Studies',
    details: {
      'Primary institutional affiliation':
        'The Royal Institute for the Advancement of Computational Network Science and Sociometric Methodologies',
      'Approximate annual household income range':
        'Between USD 95,000 and USD 120,000 per fiscal year',
      'Short biographical note':
        'A long-form biographical note describing background, methodology, publications, and other context that may exceed a single line of text and needs to wrap onto several lines without truncation.',
      'Areas of research interest': [
        'network analysis',
        'computational social science',
        'mixed methods',
        'longitudinal studies',
        'qualitative coding',
      ],
      'Personal website URL':
        'https://example.research.institute/people/henrietta-maximillian-wellington/publications',
    },
  },
  render: (args) => (
    <div className="max-w-md">
      <DataCard {...args} />
    </div>
  ),
};

/**
 * The DataCard is designed to fill its container, so it adapts to both
 * list and grid layouts without per-card configuration.
 */
export const InListLayout: Story = {
  render: () => (
    <div className="max-w-2xl">
      <Paragraph margin="none" className="mb-4 text-xs">
        Stretches to fill a wide container — typical of a list layout rendered
        by Collection&apos;s ListLayout.
      </Paragraph>
      <div className="flex flex-col gap-3">
        <DataCard
          label="Moses Crist"
          details={{ Age: 21, Location: 'New Haven' }}
        />
        <DataCard
          label="Warren Effertz"
          details={{ Age: 29, Location: 'New Hollie' }}
        />
        <DataCard
          label="Brody Hilll"
          details={{ Age: 67, Location: 'New Larryton' }}
        />
      </div>
    </div>
  ),
};

/**
 * The same component packed into a responsive grid. Each card takes the
 * full width of its grid cell and the description list still aligns its
 * label/value columns at the new (narrower) width.
 */
export const InGridLayout: Story = {
  render: () => (
    <div>
      <Paragraph margin="none" className="mb-4 text-xs">
        Drops into a responsive grid — Collection&apos;s GridLayout, or any CSS
        grid container, would render cards this way.
      </Paragraph>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DataCard
          label="Moses Crist"
          details={{ Age: 21, Location: 'New Haven' }}
        />
        <DataCard
          label="Warren Effertz"
          details={{ Age: 29, Location: 'New Hollie' }}
        />
        <DataCard
          label="Brody Hilll"
          details={{ Age: 67, Location: 'New Larryton' }}
        />
        <DataCard
          label="Dr. Arthur Wintheiser"
          details={{ Age: 61, Location: 'Bonitamouth' }}
        />
        <DataCard
          label="Destinee Hahn"
          details={{ Age: 52, Location: 'Fort Opheliashire' }}
        />
        <DataCard
          label="Theodora Dietrich"
          details={{ Age: 34, Location: 'Schaeferside' }}
        />
      </div>
    </div>
  ),
};

/**
 * Demonstrates how the card narrows in a tight column. The label/value
 * grid stays aligned and long values wrap onto multiple lines instead
 * of being truncated, satisfying the "all information must always be
 * displayed" requirement.
 */
export const NarrowContainer: Story = {
  render: () => (
    <div className="max-w-[220px]">
      <Paragraph margin="none" className="mb-4 text-xs">
        Narrow viewport — values wrap, nothing truncates.
      </Paragraph>
      <DataCard
        label="Dr. Arthur Wintheiser"
        details={{
          Age: 61,
          Location: 'Bonitamouth-on-the-Sea',
          Bio: 'Long-form biographical note that needs to wrap.',
        }}
      />
    </div>
  ),
};

/**
 * Accessibility demonstration. Each card is announced as a single
 * landmark with the title as its accessible name. The description list
 * exposes each label/value pair to assistive technology in semantic
 * order.
 */
export const Accessibility: Story = {
  render: () => (
    <div className="max-w-md space-y-4">
      <div>
        <Heading level="h4">Screen reader announcement</Heading>
        <Paragraph>
          The card below is announced as{' '}
          <em>&quot;article, Moses Crist&quot;</em> with the inner description
          list read as &quot;Age, 21. Location, New Haven.&quot;
        </Paragraph>
      </div>
      <DataCard
        label="Moses Crist"
        details={{ Age: 21, Location: 'New Haven' }}
      />
    </div>
  ),
};
