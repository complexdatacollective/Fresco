'use client';

import type { Prompt as TPrompt } from '@codaco/protocol-validation';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { motion } from 'motion/react';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { Button } from '~/components/ui/Button';
import { cx } from '~/utils/cva';
import Prompts from './Prompts';

const containerClasses =
  'w-full max-w-2xl mx-auto p-8 bg-surface text-surface-contrast publish-colors rounded';

const MotionDecorator = (Story: React.ComponentType) => {
  const decoratorVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  };

  return (
    <motion.div
      variants={decoratorVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={containerClasses}
    >
      <Story />
    </motion.div>
  );
};

const singlePrompt: TPrompt[] = [
  {
    id: 'prompt-1',
    text: 'Who are the people in your network?',
  },
];

const multiplePrompts: TPrompt[] = [
  {
    id: 'prompt-1',
    text: 'Who are the people in your network?',
  },
  {
    id: 'prompt-2',
    text: 'Who do you talk to most frequently?',
  },
  {
    id: 'prompt-3',
    text: 'Who provides you with emotional support?',
  },
  {
    id: 'prompt-4',
    text: 'Who do you go to for advice?',
  },
];

const markdownPrompts: TPrompt[] = [
  {
    id: 'prompt-1',
    text: 'Name the people who are **important** to you',
  },
  {
    id: 'prompt-2',
    text: 'Who do you *trust* the most?',
  },
  {
    id: 'prompt-3',
    text: 'List people who help with **work** or *personal* matters',
  },
];

const longPrompts: TPrompt[] = [
  {
    id: 'prompt-1',
    text: 'Please think carefully about all the people in your life who you have had any kind of meaningful interaction with in the past year, including family members, friends, colleagues, neighbors, and acquaintances',
  },
  {
    id: 'prompt-2',
    text: 'Now consider the relationships between these people and identify any who know each other independently of you',
  },
];

const meta: Meta<typeof Prompts> = {
  title: 'Interview/Components/Prompts',
  component: Prompts,
  decorators: [MotionDecorator],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    prompts: {
      control: 'object',
      description: 'Array of prompts to display',
    },
    currentPromptId: {
      control: 'text',
      description: 'ID of the currently active prompt',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SinglePrompt: Story = {
  args: {
    prompts: singlePrompt,
    currentPromptId: 'prompt-1',
  },
  parameters: {
    docs: {
      description: {
        story:
          'A single prompt without pips indicator. The pips are only shown when there are multiple prompts.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for animation to complete
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Verify the prompt text is visible
    const promptText = canvas.getByText('Who are the people in your network?');
    await expect(promptText).toBeVisible();

    // Verify no pips are rendered (single prompt)
    const pips = canvasElement.querySelectorAll('[aria-hidden="true"]');
    await expect(pips.length).toBe(0);

    // Verify accessibility attributes
    const container = canvas.getByRole('status');
    await expect(container).toHaveAttribute('aria-live', 'polite');
    await expect(container).toHaveAttribute('aria-atomic', 'true');
  },
};

export const MultiplePrompts: Story = {
  args: {
    prompts: multiplePrompts,
    currentPromptId: 'prompt-1',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Multiple prompts with pips indicator showing the current position.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for animation to complete
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Verify the prompt text is visible
    const promptText = canvas.getByText('Who are the people in your network?');
    await expect(promptText).toBeVisible();

    // Verify pips are rendered with correct count
    const pipsContainer = canvasElement.querySelector('[aria-hidden="true"]');
    await expect(pipsContainer).toBeInTheDocument();

    const pips = pipsContainer?.children;
    await expect(pips?.length).toBe(4);

    // Verify accessibility attributes
    const container = canvas.getByRole('status');
    await expect(container).toHaveAttribute('aria-live', 'polite');
  },
};

export const WithMarkdown: Story = {
  args: {
    prompts: markdownPrompts,
    currentPromptId: 'prompt-1',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Prompts can contain markdown formatting like **bold** and *italic* text.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for animation to complete
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Verify markdown is rendered - bold text should be in a strong tag
    const boldText = canvas.getByText('important');
    await expect(boldText.tagName.toLowerCase()).toBe('strong');
  },
};

export const LongPromptText: Story = {
  args: {
    prompts: longPrompts,
    currentPromptId: 'prompt-1',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Long prompts are clamped to 3 lines with a tooltip showing the full text.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    // Wait for animation to complete
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Verify the prompt is rendered
    const promptContainer = canvasElement.querySelector('.line-clamp-3');
    await expect(promptContainer).toBeInTheDocument();

    // Verify title attribute is set for tooltip
    const promptWithTitle = canvasElement.querySelector('[title]');
    await expect(promptWithTitle).toBeInTheDocument();
    await expect(promptWithTitle?.getAttribute('title')).toContain(
      'Please think carefully',
    );
  },
};

function InteractiveNavigationDemo() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(multiplePrompts.length - 1, prev + 1));
  };

  const currentPromptId = multiplePrompts[currentIndex]?.id ?? 'prompt-1';

  return (
    <div className="flex flex-col gap-6">
      <Prompts prompts={multiplePrompts} currentPromptId={currentPromptId} />
      <div
        className="flex justify-center gap-4"
        data-testid="navigation-controls"
      >
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          data-testid="prev-button"
        >
          Previous
        </Button>
        <span className="flex items-center text-sm" data-testid="current-index">
          {currentIndex + 1} / {multiplePrompts.length}
        </span>
        <Button
          variant="outline"
          onClick={handleNext}
          disabled={currentIndex === multiplePrompts.length - 1}
          data-testid="next-button"
        >
          Next
        </Button>
      </div>
    </div>
  );
}

export const InteractiveNavigation: Story = {
  render: () => <InteractiveNavigationDemo />,
  parameters: {
    docs: {
      description: {
        story:
          'Interactive demo showing navigation between prompts with animation direction changes.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for initial render
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Verify initial state
    const indexDisplay = canvas.getByTestId('current-index');
    await expect(indexDisplay).toHaveTextContent('1 / 4');

    // Verify first prompt is shown
    await expect(
      canvas.getByText('Who are the people in your network?'),
    ).toBeVisible();

    // Click next button
    const nextButton = canvas.getByTestId('next-button');
    await userEvent.click(nextButton);

    // Wait for animation
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Verify second prompt is shown
    await expect(
      canvas.getByText('Who do you talk to most frequently?'),
    ).toBeVisible();
    await expect(indexDisplay).toHaveTextContent('2 / 4');

    // Verify pip changed - find the pips container and check active state
    const pipsContainer = canvasElement.querySelector('[aria-hidden="true"]');
    const pips = pipsContainer?.children;
    if (pips && pips.length > 1) {
      // Second pip should be active
      const secondPip = pips[1];
      await expect(secondPip).toHaveAttribute('data-active', 'true');
    }

    // Click next again to get to prompt 3
    await userEvent.click(nextButton);
    await new Promise((resolve) => setTimeout(resolve, 500));
    await expect(indexDisplay).toHaveTextContent('3 / 4');

    // Click previous to go back
    const prevButton = canvas.getByTestId('prev-button');
    await userEvent.click(prevButton);
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Verify we're back at prompt 2
    await expect(indexDisplay).toHaveTextContent('2 / 4');
    await expect(
      canvas.getByText('Who do you talk to most frequently?'),
    ).toBeVisible();

    // Test boundary - go to last prompt
    await userEvent.click(nextButton);
    await new Promise((resolve) => setTimeout(resolve, 300));
    await userEvent.click(nextButton);
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Next button should be disabled at the end
    await expect(nextButton).toBeDisabled();
    await expect(indexDisplay).toHaveTextContent('4 / 4');

    // Go back to first
    await userEvent.click(prevButton);
    await new Promise((resolve) => setTimeout(resolve, 300));
    await userEvent.click(prevButton);
    await new Promise((resolve) => setTimeout(resolve, 300));
    await userEvent.click(prevButton);
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Previous button should be disabled at the start
    await expect(prevButton).toBeDisabled();
    await expect(indexDisplay).toHaveTextContent('1 / 4');
  },
};

export const AccessibilityDemo: Story = {
  args: {
    prompts: multiplePrompts,
    currentPromptId: 'prompt-2',
  },
  parameters: {
    docs: {
      description: {
        story: `
**Accessibility Features:**

- \`role="status"\` on the container indicates it announces current state
- \`aria-live="polite"\` ensures screen readers announce prompt changes
- \`aria-atomic="true"\` announces the entire prompt, not just changed words
- Pips have \`aria-hidden="true"\` since they're purely visual indicators
- Prompt text uses \`<h2>\` heading for document structure
        `,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for render
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Verify status role for announcing state
    const statusContainer = canvas.getByRole('status');
    await expect(statusContainer).toBeInTheDocument();

    // Verify aria-live is set to polite (non-interruptive announcements)
    await expect(statusContainer).toHaveAttribute('aria-live', 'polite');

    // Verify aria-atomic is true (announce complete prompt)
    await expect(statusContainer).toHaveAttribute('aria-atomic', 'true');

    // Verify pips are hidden from assistive technology
    const pipsContainer = canvasElement.querySelector('[aria-hidden="true"]');
    await expect(pipsContainer).toBeInTheDocument();

    // Verify heading structure
    const heading = canvas.getByRole('heading', { level: 2 });
    await expect(heading).toBeInTheDocument();
  },
};

export const CustomClassName: Story = {
  args: {
    prompts: singlePrompt,
    currentPromptId: 'prompt-1',
    className: cx('text-3xl'),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Custom CSS classes can be applied to the Prompts container for styling.',
      },
    },
  },
};

export const EmptyPrompts: Story = {
  args: {
    prompts: [],
    currentPromptId: '',
  },
  parameters: {
    docs: {
      description: {
        story: 'Edge case: Component handles empty prompts array gracefully.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for render
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Verify the container is rendered but empty
    const statusContainer = canvas.getByRole('status');
    await expect(statusContainer).toBeInTheDocument();

    // No pips should be rendered
    const pipsContainer = canvasElement.querySelector('[aria-hidden="true"]');
    await expect(pipsContainer).not.toBeInTheDocument();
  },
};
