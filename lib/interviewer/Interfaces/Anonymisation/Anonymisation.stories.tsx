import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useMemo } from 'react';
import SuperJSON from 'superjson';
import StoryInterviewShell from '~/.storybook/StoryInterviewShell';
import { SyntheticInterview } from '~/lib/interviewer/utils/SyntheticInterview/SyntheticInterview';

type StoryArgs = {
  title: string;
  body: string;
};

function buildInterview(args: StoryArgs) {
  const interview = new SyntheticInterview();

  interview.addInformationStage({
    title: 'Welcome',
    text: 'Before the anonymisation stage.',
  });

  interview.addStage('Anonymisation', {
    explanationText: { title: args.title, body: args.body },
  });

  interview.addInformationStage({
    title: 'Complete',
    text: 'After the anonymisation stage.',
  });

  return interview;
}

const AnonymisationStoryWrapper = (args: StoryArgs) => {
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
  title: 'Interview/Interfaces/Anonymisation',
  parameters: {
    forceTheme: 'interview',
    layout: 'fullscreen',
  },
  argTypes: {
    title: {
      control: 'text',
      description: 'Explanation text title',
    },
    body: {
      control: 'text',
      description: 'Explanation text body (supports markdown)',
    },
  },
  args: {
    title: 'Data Anonymisation',
    body: 'Your data will be anonymised using a **passphrase** that you create below.\n\nThis passphrase is used to generate a unique encryption key that replaces any identifying information in your responses. Only someone with the same passphrase can link your data back to you.\n\nPlease choose a passphrase that is memorable but not easily guessed.',
  },
};

export default meta;
type Story = StoryObj<StoryArgs>;

export const Default: Story = {
  render: (args) => <AnonymisationStoryWrapper {...args} />,
};

export const MinimalExplanation: Story = {
  render: (args) => <AnonymisationStoryWrapper {...args} />,
  args: {
    title: 'Anonymise Your Data',
    body: 'Please create a passphrase to protect your identity.',
  },
};

export const DetailedInstructions: Story = {
  render: (args) => <AnonymisationStoryWrapper {...args} />,
  args: {
    title: 'Participant Data Protection',
    body: [
      '## Why Anonymisation?',
      '',
      'This study collects information about your social network. To protect',
      'your privacy and the privacy of the people you mention, we use a',
      'passphrase-based anonymisation process.',
      '',
      '## How It Works',
      '',
      '1. You create a **unique passphrase** below',
      '2. This passphrase generates a cryptographic key',
      '3. All names and identifying details are replaced with anonymous codes',
      '4. Only someone with your exact passphrase can reverse the process',
      '',
      '## Important',
      '',
      '- Choose something **memorable** — you may need it again in follow-up sessions',
      '- Do **not** share your passphrase with anyone',
      '- If you forget your passphrase, your data cannot be de-anonymised',
      '',
      '> Your passphrase is never stored. It is used only to derive the encryption key.',
    ].join('\n'),
  },
};
