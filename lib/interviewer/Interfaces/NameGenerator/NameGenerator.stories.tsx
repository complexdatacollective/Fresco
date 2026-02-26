'use client';

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
      <StoryInterviewShell rawPayload={rawPayload} disableSync />
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
