'use client';

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import SlidesForm from './SlidesForm';

const meta: Meta<typeof SlidesForm> = {
  title: 'Interviewer/Containers/SlidesForm',
  component: SlidesForm,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'SlidesForm is a wizard-style container for collecting form data across multiple items (nodes or edges). It displays an introduction screen, then cycles through each item with a form, showing progress at the bottom. Used by AlterForm and EgoForm interview stages.\n\n**Note:** This component requires complex protocol data and Redux state. For visual testing, use the actual interview interface with a test protocol.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Placeholder: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'SlidesForm requires complex protocol data, interviewer state, and form configuration. Stories cannot be created without extensive mocking. Test this component in the actual interview interface.',
      },
    },
  },
  render: () => {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-0 p-8 text-center">
        <div className="max-w-2xl">
          <h2 className="mb-4 text-2xl font-bold">SlidesForm Component</h2>
          <p className="text-text/70 mb-4">
            This component is part of the interview system and requires:
          </p>
          <ul className="text-text/70 mb-6 space-y-2 text-left">
            <li>• Protocol validation and stage configuration</li>
            <li>• Redux store with interviewer state</li>
            <li>• Form fields from protocol definition</li>
            <li>• Network canvas nodes or edges as items</li>
            <li>• Navigation helpers and stage management</li>
          </ul>
          <p className="text-text/70">
            To see this component in action, run the interview interface with a
            test protocol that includes AlterForm or EgoForm stages.
          </p>
        </div>
      </div>
    );
  },
};
