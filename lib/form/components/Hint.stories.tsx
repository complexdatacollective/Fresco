import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import Hint from './Hint';

/**
 * The Hint component renders supplementary text below a field label. It
 * accepts a `ReactNode` as children. When the children contain a string,
 * that string is rendered with `RenderMarkdown`, so hints can include
 * `*italic*` and `**bold**` formatting. Non-string children (such as the
 * auto-generated validation summary rendered by `Field`) pass through
 * untouched.
 */
const meta: Meta<typeof Hint> = {
  title: 'Systems/Form/Hint',
  component: Hint,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  args: {
    id: 'hint-example',
  },
};

export default meta;

type Story = StoryObj<typeof Hint>;

export const Plain: Story = {
  args: {
    children: 'A plain hint with no formatting.',
  },
};

export const Markdown: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <Hint id="hint-italic">This has *italic* text</Hint>
      <Hint id="hint-bold">This has **bold** text</Hint>
      <Hint id="hint-mixed">Mix of **bold** and *italic* in one hint</Hint>
      <Hint id="hint-all-italic">*Entire hint is italic*</Hint>
      <Hint {...args} />
    </div>
  ),
  args: {
    children: 'A plain hint with no formatting.',
  },
  parameters: {
    docs: {
      description: {
        story:
          'When the hint child is a string, it is rendered with `RenderMarkdown` and supports `*italic*` and `**bold**`.',
      },
    },
  },
};

/**
 * Hint also renders non-string children as-is. The `Field` component uses
 * this to append an auto-generated validation summary after the hint text.
 * Here the summary is simulated with a static list.
 */
export const WithValidationSummary: Story = {
  render: () => (
    <Hint id="hint-with-summary">
      Use a mix of letters, numbers, and symbols for a **strong** password.
      <ul>
        <li>At least 8 characters</li>
        <li>No more than 64 characters</li>
      </ul>
    </Hint>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'String children are wrapped in `RenderMarkdown`; non-string children (e.g. a validation summary element) render unchanged.',
      },
    },
  },
};
