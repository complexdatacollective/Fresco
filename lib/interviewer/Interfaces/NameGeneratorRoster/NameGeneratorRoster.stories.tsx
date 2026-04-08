import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useMemo } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import SuperJSON from 'superjson';
import StoryInterviewShell from '~/.storybook/StoryInterviewShell';
import { SyntheticInterview } from '~/lib/interviewer/utils/SyntheticInterview/SyntheticInterview';

const ROSTER_SIZES = [50, 100, 1000, 5000, 50000] as const;
type RosterSize = (typeof ROSTER_SIZES)[number];

type StoryArgs = {
  rosterSize: RosterSize;
  initialSelectedCount: number;
  promptCount: number;
  minNodes: number;
  maxNodes: number;
};

function buildInterview(args: StoryArgs) {
  const si = new SyntheticInterview();

  const nodeType = si.addNodeType({ name: 'Person' });
  const nameVar = nodeType.addVariable({ name: 'name', type: 'text' });
  const ageVar = nodeType.addVariable({ name: 'age', type: 'number' });
  const locationVar = nodeType.addVariable({
    name: 'location',
    type: 'text',
  });

  si.addInformationStage({
    title: 'Welcome',
    text: 'Before the main stage.',
  });

  const behaviours: { minNodes?: number; maxNodes?: number } = {};
  if (args.minNodes > 0) behaviours.minNodes = args.minNodes;
  if (args.maxNodes > 0) behaviours.maxNodes = args.maxNodes;

  const stage = si.addStage('NameGeneratorRoster', {
    label: 'Select People',
    initialNodes: args.initialSelectedCount,
    subject: { entity: 'node', type: nodeType.id },
    dataSource: 'externalData',
    behaviours: Object.keys(behaviours).length > 0 ? behaviours : undefined,
    cardOptions: {
      displayLabel: nameVar.id,
      additionalProperties: [
        { label: 'Age', variable: ageVar.id },
        { label: 'Location', variable: locationVar.id },
      ],
    },
    sortOptions: {
      sortOrder: [{ property: nameVar.id, direction: 'asc' }],
      sortableProperties: [
        { variable: nameVar.id, label: 'Name' },
        { variable: ageVar.id, label: 'Age' },
        { variable: locationVar.id, label: 'Location' },
      ],
    },
    searchOptions: {
      fuzziness: 0.6,
      matchProperties: [nameVar.id, locationVar.id],
    },
  });

  for (let i = 0; i < args.promptCount; i++) {
    stage.addPrompt({
      text: `Prompt ${i + 1}: Please select the people you know from this list.`,
    });
  }

  si.addAsset({
    key: 'asset-external-data',
    assetId: 'externalData',
    name: 'External Data',
    type: 'network',
    url: `/storybook/roster-${args.rosterSize}.json`,
    size: 0,
  });

  si.addInformationStage({
    title: 'Complete',
    text: 'After the main stage.',
  });

  return si;
}

const NameGeneratorRosterStoryWrapper = (args: StoryArgs) => {
  const configKey = JSON.stringify(args);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const interview = useMemo(() => buildInterview(args), [configKey]);
  const rawPayload = useMemo(
    () =>
      SuperJSON.stringify(interview.getInterviewPayload({ currentStep: 1 })),
    [interview],
  );

  return (
    <div className="flex h-dvh w-full">
      <StoryInterviewShell rawPayload={rawPayload} disableSync />
    </div>
  );
};

const meta: Meta<StoryArgs> = {
  title: 'Interview/Interfaces/NameGeneratorRoster',
  parameters: {
    forceTheme: 'interview',
    layout: 'fullscreen',
  },
  argTypes: {
    rosterSize: {
      control: 'select',
      options: ROSTER_SIZES,
      description: 'Number of items in the external data roster',
    },
    initialSelectedCount: {
      control: { type: 'range', min: 0, max: 10 },
      description: 'Pre-selected nodes assigned to prompt 1',
    },
    promptCount: {
      control: { type: 'range', min: 1, max: 4 },
      description: 'Number of prompts (pips appear for 2+)',
    },
    minNodes: {
      control: 'number',
      description: 'Min node constraint (0 = disabled)',
    },
    maxNodes: {
      control: 'number',
      description: 'Max node constraint (0 = no limit)',
    },
  },
  args: {
    rosterSize: 100,
    initialSelectedCount: 0,
    promptCount: 1,
    minNodes: 0,
    maxNodes: 0,
  },
};

export default meta;
type Story = StoryObj<StoryArgs>;

export const Default: Story = {
  render: (args) => <NameGeneratorRosterStoryWrapper {...args} />,
};

export const WithSelectedNodes: Story = {
  render: (args) => <NameGeneratorRosterStoryWrapper {...args} />,
  args: {
    initialSelectedCount: 4,
  },
};

export const LargeRoster: Story = {
  render: (args) => <NameGeneratorRosterStoryWrapper {...args} />,
  args: {
    rosterSize: 5000,
  },
};

export const StressTest: Story = {
  render: (args) => <NameGeneratorRosterStoryWrapper {...args} />,
  args: {
    rosterSize: 50000,
  },
};

export const WithMinNodes: Story = {
  render: (args) => <NameGeneratorRosterStoryWrapper {...args} />,
  args: {
    minNodes: 3,
  },
};

export const WithMaxNodes: Story = {
  render: (args) => <NameGeneratorRosterStoryWrapper {...args} />,
  args: {
    maxNodes: 5,
    initialSelectedCount: 3,
  },
};

export const MultiplePrompts: Story = {
  render: (args) => <NameGeneratorRosterStoryWrapper {...args} />,
  args: {
    promptCount: 3,
    initialSelectedCount: 2,
  },
};

/**
 * Waits for the roster to finish loading and returns the available-to-add
 * panel canvas (the source listbox), bypassing the destination NodeList.
 */
const waitForSourceCanvas = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement);
  const sourceListbox = await waitFor(
    () => {
      const source = canvas.getByRole('listbox', {
        name: 'Available Roster Nodes',
      });
      const options = within(source).queryAllByRole('option');
      if (options.length === 0) throw new Error('Roster items not yet loaded');
      return source;
    },
    { timeout: 10000 },
  );
  return within(sourceListbox);
};

/**
 * Reads the accessible name (`aria-label`) of each card in the source
 * listbox. Each option contains a `<DataCard>` rendered as
 * `<article aria-label="...">`, which gives us the card title without
 * the description-list contents bleeding into the string.
 */
const readSourceLabels = (source: ReturnType<typeof within>): string[] =>
  source
    .getAllByRole('option')
    .map(
      (el: HTMLElement) =>
        el.querySelector('article[aria-label]')?.getAttribute('aria-label') ??
        '',
    );

/**
 * Interaction test: clicking "Sort by Name" reorders the roster
 * alphabetically. Regression guard for the UUID-keyed attribute path
 * in sort rules — if `useExternalData`'s UUID replacer or
 * `getNodeLabelAttribute` codebook lookup ever silently breaks again,
 * the items will not be in alphabetical order and this test will fail.
 */
export const SortInteraction: Story = {
  render: (args) => <NameGeneratorRosterStoryWrapper {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const source = await waitForSourceCanvas(canvasElement);

    const sortByNameButton = canvas.getByRole('button', {
      name: /^Sort by Name/,
    });
    await userEvent.click(sortByNameButton);

    await waitFor(() => {
      const labels = readSourceLabels(source).slice(0, 5);

      // Sort must be ascending alphabetical
      const sortedCopy = [...labels].sort((a, b) => a.localeCompare(b));
      expect(labels).toEqual(sortedCopy);

      // The first label must start with 'A' (otherwise the sort silently
      // failed and items are still in their original load order).
      expect(labels[0]?.[0]?.toLowerCase()).toBe('a');
    });

    // Toggle to descending and verify the order reverses
    await userEvent.click(sortByNameButton);

    await waitFor(() => {
      const labels = readSourceLabels(source).slice(0, 5);
      const sortedDescCopy = [...labels].sort((a, b) => b.localeCompare(a));
      expect(labels).toEqual(sortedDescCopy);
    });
  },
};

/**
 * Interaction test: typing into the filter input narrows the roster.
 * Regression guard for the filter-keys-by-UUID path. If the UUID
 * conversion ever breaks, the search worker will index against missing
 * properties and the result count will not change when typing. We
 * cannot count visible options because the source list is virtualized,
 * so we read the "N results" badge that CollectionFilterInput renders
 * once a filter query becomes active.
 */
export const FilterInteraction: Story = {
  render: (args) => <NameGeneratorRosterStoryWrapper {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const source = await waitForSourceCanvas(canvasElement);
    expect(source.getAllByRole('option').length).toBeGreaterThan(10);

    const filterInput = canvas.getByRole('searchbox', { name: 'Filter' });
    await userEvent.type(filterInput, 'Moses Crist');

    // Wait for debounced search + result count to settle, then assert
    // that there are strictly fewer matches than the dataset (100), and
    // that the top-ranked result is the exact-match seed. We read the
    // accessible name of the first card (the <article aria-label=...>)
    // rather than its textContent so the description-list contents
    // don't bleed into the comparison.
    await waitFor(
      () => {
        const resultBadge = canvas.getByText(/\d+ results?/);
        const matches = resultBadge.textContent?.match(/(\d+)/);
        const count = Number(matches?.[1]);
        expect(count).toBeGreaterThan(0);
        expect(count).toBeLessThan(100);

        const firstLabel = readSourceLabels(source)[0];
        expect(firstLabel).toBe('Moses Crist');
      },
      { timeout: 5000 },
    );
  },
};
