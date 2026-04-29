import { entityAttributesProperty } from '@codaco/shared-consts';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useMemo } from 'react';
import { expect, screen, userEvent, waitFor, within } from 'storybook/test';
import SuperJSON from 'superjson';
import StoryInterviewShell from '~/.storybook/StoryInterviewShell';
import { SyntheticInterview } from '~/lib/interviewer/utils/SyntheticInterview/SyntheticInterview';

type StageType = 'NameGenerator' | 'NameGeneratorQuickAdd';

type StoryArgs = {
  stageType: StageType;
  initialNodeCount: number;
  promptCount: number;
  panelCount: number;
  minNodes: number;
  maxNodes: number;
};

function buildInterview(args: StoryArgs) {
  const interview = new SyntheticInterview();

  const nodeType = interview.addNodeType({ name: 'Person' });
  nodeType.addVariable({ type: 'text', name: 'Name' });

  interview.addInformationStage({
    title: 'Welcome',
    text: 'Before the main stage.',
  });

  const behaviours =
    args.minNodes > 0 || args.maxNodes > 0
      ? {
          ...(args.minNodes > 0 ? { minNodes: args.minNodes } : {}),
          ...(args.maxNodes > 0 ? { maxNodes: args.maxNodes } : {}),
        }
      : undefined;

  if (args.stageType === 'NameGenerator') {
    const stage = interview.addStage('NameGenerator', {
      label: 'Name Generator',
      initialNodes: args.initialNodeCount,
      subject: { entity: 'node', type: nodeType.id },
      behaviours,
    });

    stage.addFormField({ component: 'Text', prompt: 'What is their name?' });
    stage.addFormField({ component: 'Number', prompt: 'How old are they?' });
    stage.addFormField({
      component: 'Text',
      prompt: 'Do they have a nickname?',
    });

    for (let i = 0; i < args.promptCount; i++) {
      stage.addPrompt({
        text: `Prompt ${i + 1}: Please name the people you know.`,
      });
    }

    for (let i = 0; i < args.panelCount; i++) {
      stage.addPanel({ title: `Panel ${i + 1}` });
    }
  } else {
    const stage = interview.addStage('NameGeneratorQuickAdd', {
      label: 'Name Generator',
      initialNodes: args.initialNodeCount,
      subject: { entity: 'node', type: nodeType.id },
      behaviours,
    });

    for (let i = 0; i < args.promptCount; i++) {
      stage.addPrompt({
        text: `Prompt ${i + 1}: Please name the people you know.`,
      });
    }

    for (let i = 0; i < args.panelCount; i++) {
      stage.addPanel({ title: `Panel ${i + 1}` });
    }
  }

  interview.addInformationStage({
    title: 'Complete',
    text: 'After the main stage.',
  });

  return interview;
}

const NameGeneratorStoryWrapper = (args: StoryArgs) => {
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
  title: 'Interview/Interfaces/NameGenerator',
  parameters: {
    forceTheme: 'interview',
    layout: 'fullscreen',
  },
  argTypes: {
    stageType: {
      control: 'radio',
      options: ['NameGeneratorQuickAdd', 'NameGenerator'],
      description: 'Quick-add input or form dialog',
    },
    initialNodeCount: {
      control: { type: 'range', min: 0, max: 15 },
      description: 'Pre-populated nodes assigned to prompt 1',
    },
    promptCount: {
      control: { type: 'range', min: 1, max: 4 },
      description: 'Number of prompts (pips appear for 2+)',
    },
    panelCount: {
      control: { type: 'range', min: 0, max: 2 },
      description: 'Side panels (dataSource: existing)',
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
    stageType: 'NameGeneratorQuickAdd',
    initialNodeCount: 3,
    promptCount: 2,
    panelCount: 1,
    minNodes: 0,
    maxNodes: 0,
  },
};

export default meta;
type Story = StoryObj<StoryArgs>;

export const Default: Story = {
  render: (args) => <NameGeneratorStoryWrapper {...args} />,
};

export const MinNodesValidation: Story = {
  args: {
    stageType: 'NameGeneratorQuickAdd',
    initialNodeCount: 0,
    promptCount: 1,
    panelCount: 0,
    minNodes: 3,
    maxNodes: 0,
  },
  render: (args) => <NameGeneratorStoryWrapper {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const forwardButton = canvas.getByRole('button', { name: 'Next Step' });
    await userEvent.click(forwardButton);

    await waitFor(async () => {
      await expect(
        screen.getByText(/must create at least/i),
      ).toBeInTheDocument();
    });

    await expect(screen.getByText('3')).toBeInTheDocument();
  },
};

export const MaxNodesReached: Story = {
  args: {
    stageType: 'NameGeneratorQuickAdd',
    initialNodeCount: 3,
    promptCount: 1,
    panelCount: 0,
    minNodes: 0,
    maxNodes: 3,
  },
  render: (args) => <NameGeneratorStoryWrapper {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const forwardButton = canvas.getByRole('button', { name: 'Next Step' });
    await waitFor(
      async () => {
        await expect(forwardButton.className).toMatch(/animate-pulse-glow/);
      },
      { timeout: 3000 },
    );
  },
};

/**
 * Tests keyboard drag-and-drop from an "existing" side panel to the main node list.
 *
 * Setup: 3 initial nodes with empty promptIDs sit in the network. The "existing"
 * panel shows them (they're not assigned to the current prompt). The main list
 * is empty. Dragging a node from the panel to the main list adds it to the
 * current prompt.
 */
export const DragFromPanelToMainList: Story = {
  args: {
    stageType: 'NameGeneratorQuickAdd',
    initialNodeCount: 3,
    promptCount: 1,
    panelCount: 1,
    minNodes: 0,
    maxNodes: 0,
  },
  render: (args) => <NameGeneratorStoryWrapper {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for the panel to render with nodes.
    // Nodes inside the Collection are role="option" (within a role="listbox").
    const panel = await waitFor(
      async () => {
        const p = canvas.getByTestId('node-panel');
        const nodes = within(p).getAllByRole('option');
        // With 3 initial nodes and empty promptIDs, the existing panel
        // shows all 3.
        await expect(nodes.length).toBe(3);
        return p;
      },
      { timeout: 5000 },
    );

    // Main list should start empty (no nodes assigned to this prompt).
    const mainList = canvas.getByTestId('node-list');
    const mainNodesBefore = within(mainList).queryAllByRole('option').length;
    await expect(mainNodesBefore).toBe(0);

    // Focus the first panel node and initiate a keyboard drag.
    const firstPanelNode = within(panel).getAllByRole('option')[0]!;
    firstPanelNode.focus();

    // Ctrl+D starts keyboard drag mode.
    await userEvent.keyboard('{Control>}d{/Control}');

    // Arrow key navigates to the next compatible drop target (main list).
    await userEvent.keyboard('{ArrowRight}');

    // Enter confirms the drop.
    await userEvent.keyboard('{Enter}');

    // Assert: panel lost one node, main list gained one.
    await waitFor(
      async () => {
        const panelNodesAfter =
          within(panel).queryAllByRole('option').length;
        const mainNodesAfter =
          within(mainList).queryAllByRole('option').length;
        await expect(panelNodesAfter).toBe(2);
        await expect(mainNodesAfter).toBe(1);
      },
      { timeout: 5000 },
    );
  },
};

// --- External data panel ---

/**
 * Build an external data JSON payload as a blob: URL.
 * `loadExternalData` calls `fetch(url)` which supports blob: URLs.
 */
function buildExternalDataUrl(names: string[]) {
  const nodes = names.map((name) => ({
    [entityAttributesProperty]: { Name: name },
  }));
  const blob = new Blob([JSON.stringify({ nodes })], {
    type: 'application/json',
  });
  return URL.createObjectURL(blob);
}

function buildExternalDataInterview() {
  const interview = new SyntheticInterview();

  const nodeType = interview.addNodeType({ name: 'Person' });
  nodeType.addVariable({ type: 'text', name: 'Name' });

  interview.addInformationStage({
    title: 'Welcome',
    text: 'Before the main stage.',
  });

  const stage = interview.addStage('NameGeneratorQuickAdd', {
    label: 'Name Generator',
    initialNodes: 0,
    subject: { entity: 'node', type: nodeType.id },
  });

  stage.addPrompt({ text: 'Name the people you know.' });

  const externalNames = [
    'Alice',
    'Bob',
    'Charlie',
    'Diana',
    'Eve',
    'Frank',
    'Grace',
    'Hector',
    'Iris',
    'Jack',
    'Karen',
    'Leo',
    'Mona',
    'Nate',
    'Olivia',
    'Pete',
    'Quinn',
    'Rosa',
    'Sam',
    'Tina',
  ];

  const assetId = 'external-contacts';
  interview.addAsset({
    key: assetId,
    assetId,
    name: 'contacts.json',
    type: 'network',
    url: buildExternalDataUrl(externalNames),
    size: 0,
  });

  stage.addPanel({ title: 'Imported Contacts', dataSource: assetId });

  interview.addInformationStage({
    title: 'Complete',
    text: 'After the main stage.',
  });

  return interview;
}

const ExternalDataStoryWrapper = () => {
  const interview = useMemo(() => buildExternalDataInterview(), []);
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

/**
 * Tests keyboard drag-and-drop from an external data panel to the main node list.
 *
 * 20 contacts (Alice–Tina) are loaded from a blob: URL into the side panel.
 * Dragging one to the main list adds it to the network and current prompt.
 */
export const DragFromExternalDataPanel: Story = {
  args: {
    stageType: 'NameGeneratorQuickAdd',
    initialNodeCount: 0,
    promptCount: 1,
    panelCount: 0,
    minNodes: 0,
    maxNodes: 0,
  },
  render: () => <ExternalDataStoryWrapper />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const getPanel = () => canvas.getByTestId('node-panel');
    const getMainList = () => canvas.getByTestId('node-list');

    // Wait for the external data panel to load and render all 20 nodes.
    await waitFor(
      async () => {
        const nodes = within(getPanel()).getAllByRole('option');
        await expect(nodes.length).toBe(20);
      },
      { timeout: 10000 },
    );

    await expect(
      within(getMainList()).queryAllByRole('option').length,
    ).toBe(0);

    // Drag from panel → main list via keyboard.
    // Focus the first panel node and use Ctrl+D to start keyboard drag.
    within(getPanel()).getAllByRole('option')[0]!.focus();
    await userEvent.keyboard('{Control>}d{/Control}');
    await userEvent.keyboard('{ArrowRight}');
    await userEvent.keyboard('{Enter}');

    // Verify: panel lost one node, main list gained one.
    await waitFor(
      async () => {
        await expect(
          within(getPanel()).queryAllByRole('option').length,
        ).toBe(19);
        await expect(
          within(getMainList()).getAllByRole('option').length,
        ).toBe(1);
      },
      { timeout: 5000 },
    );
  },
};

