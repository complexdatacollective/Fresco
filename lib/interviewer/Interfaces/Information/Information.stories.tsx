import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useMemo } from 'react';
import SuperJSON from 'superjson';
import StoryInterviewShell from '~/.storybook/StoryInterviewShell';
import { SyntheticInterview } from '~/lib/interviewer/utils/SyntheticInterview/SyntheticInterview';

type StoryArgs = {
  title: string;
  content: string;
};

function buildInterview(args: StoryArgs) {
  const interview = new SyntheticInterview();

  interview.addInformationStage({
    title: 'Before',
    text: 'Padding stage before the main information stage.',
  });

  interview.addInformationStage({
    title: args.title,
    text: args.content,
  });

  interview.addInformationStage({
    title: 'After',
    text: 'Padding stage after the main information stage.',
  });

  return interview;
}

const InformationStoryWrapper = (args: StoryArgs) => {
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
  title: 'Interview/Interfaces/Information',
  parameters: {
    forceTheme: 'interview',
    layout: 'fullscreen',
  },
  argTypes: {
    title: {
      control: 'text',
      description: 'Stage title displayed as a heading',
    },
    content: {
      control: { type: 'text' },
      description: 'Markdown content displayed in the stage body',
    },
  },
  args: {
    title: 'Welcome',
    content:
      'Thank you for participating in this study. Please read each screen carefully and follow the instructions provided.',
  },
};

export default meta;
type Story = StoryObj<StoryArgs>;

export const Default: Story = {
  render: (args) => <InformationStoryWrapper {...args} />,
};

export const LongContent: Story = {
  render: (args) => <InformationStoryWrapper {...args} />,
  args: {
    title: 'Study Instructions',
    content: [
      '## Overview',
      '',
      'This study explores how people maintain social connections.',
      'You will be asked a series of questions about the people in',
      'your life and how they relate to one another.',
      '',
      '## What to Expect',
      '',
      '- **Name Generator**: List people you interact with regularly',
      '- **Categorisation**: Group those people by relationship type',
      '- **Dyad Census**: Indicate which of your contacts know each',
      '  other',
      '',
      '## Important Notes',
      '',
      '1. There are no right or wrong answers',
      '2. All responses are **confidential**',
      '3. You may skip any question you are uncomfortable answering',
      '4. The session typically takes 15-20 minutes',
      '',
      'If you have questions at any point, please ask the',
      'interviewer for clarification.',
    ].join('\n'),
  },
};

export const MarkdownFormatting: Story = {
  render: (args) => <InformationStoryWrapper {...args} />,
  args: {
    title: 'Formatting Demo',
    content: [
      '# Heading 1',
      '',
      '## Heading 2',
      '',
      '### Heading 3',
      '',
      'Regular paragraph with **bold text** and *italic text*.',
      '',
      '---',
      '',
      '### Unordered List',
      '',
      '- First item',
      '- Second item',
      '  - Nested item',
      '- Third item',
      '',
      '### Ordered List',
      '',
      '1. Step one',
      '2. Step two',
      '3. Step three',
      '',
      '### Code',
      '',
      'Inline `code` and a fenced block:',
      '',
      '```',
      'const greeting = "hello";',
      '```',
      '',
      '> This is a blockquote with a longer passage of text',
      '> that spans multiple lines.',
    ].join('\n'),
  },
};
