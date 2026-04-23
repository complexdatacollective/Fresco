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
      <StoryInterviewShell rawPayload={rawPayload} />
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
 * Waits for the roster to finish loading and returns the source listbox
 * element (the "Available to add" panel), bypassing the destination
 * NodeList.
 */
const waitForSourceListbox = async (
  canvasElement: HTMLElement,
): Promise<HTMLElement> => {
  const canvas = within(canvasElement);
  return waitFor(
    () => {
      const source = canvas.getByRole('listbox', {
        name: 'Available Roster Nodes',
      });
      const options = source.querySelectorAll('[role="option"]');
      if (options.length === 0) throw new Error('Roster items not yet loaded');
      return source;
    },
    { timeout: 10000 },
  );
};

/**
 * Reads the accessible name (`aria-label`) of each card in the source
 * listbox. Each option element is the `<DataCard>` itself — an
 * `<article aria-label="...">` — so we read the label directly off the
 * option element rather than searching descendants.
 */
const readSourceLabels = (sourceListbox: HTMLElement): string[] =>
  Array.from(sourceListbox.querySelectorAll('[role="option"]')).map(
    (el) => el.getAttribute('aria-label') ?? '',
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
    await waitForSourceListbox(canvasElement);

    const sortByNameButton = canvas.getByRole('button', {
      name: /^Sort by Name/,
    });
    await userEvent.click(sortByNameButton);

    await waitFor(
      async () => {
        // Re-query the listbox each iteration — the element reference may
        // change as the virtualized list re-renders during sort.
        const sourceListbox = canvas.getByRole('listbox', {
          name: 'Available Roster Nodes',
        });
        const labels = readSourceLabels(sourceListbox).slice(0, 5);

        await expect(labels.length).toBeGreaterThan(0);

        // Sort must be ascending alphabetical
        const sortedCopy = [...labels].sort((a, b) => a.localeCompare(b));
        await expect(labels).toEqual(sortedCopy);

        // The first label must start with 'A' (otherwise the sort silently
        // failed and items are still in their original load order).
        await expect(labels[0]?.[0]?.toLowerCase()).toBe('a');
      },
      { timeout: 5000 },
    );

    // Toggle to descending and verify the order reverses
    await userEvent.click(sortByNameButton);

    await waitFor(
      async () => {
        const sourceListbox = canvas.getByRole('listbox', {
          name: 'Available Roster Nodes',
        });
        const labels = readSourceLabels(sourceListbox).slice(0, 5);
        await expect(labels.length).toBeGreaterThan(0);
        const sortedDescCopy = [...labels].sort((a, b) => b.localeCompare(a));
        await expect(labels).toEqual(sortedDescCopy);
      },
      { timeout: 5000 },
    );
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
    const initialListbox = await waitForSourceListbox(canvasElement);
    // Virtualized list only renders what fits the viewport plus overscan,
    // so we only assert on "enough to run the test" rather than a specific
    // count tied to viewport height.
    await expect(
      initialListbox.querySelectorAll('[role="option"]').length,
    ).toBeGreaterThanOrEqual(5);

    const filterInput = canvas.getByRole('searchbox', { name: 'Filter' });
    await userEvent.type(filterInput, 'Moses Crist');

    // Wait for debounced search + result count to settle, then assert
    // that there are strictly fewer matches than the dataset (100), and
    // that the top-ranked result is the exact-match seed. We read the
    // accessible name of the first card (the <article aria-label=...>)
    // rather than its textContent so the description-list contents
    // don't bleed into the comparison.
    await waitFor(
      async () => {
        const resultBadge = canvas.getByText(/\d+ results?/);
        const matches = /(\d+)/.exec(resultBadge.textContent);
        const count = Number(matches?.[1]);
        await expect(count).toBeGreaterThan(0);
        await expect(count).toBeLessThan(100);

        // Re-query the listbox — virtualized list re-renders during filter.
        const currentListbox = canvas.getByRole('listbox', {
          name: 'Available Roster Nodes',
        });
        const firstLabel = readSourceLabels(currentListbox)[0];
        await expect(firstLabel).toBe('Moses Crist');
      },
      { timeout: 10000 },
    );
  },
};
