import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import ImportToastContent from './ImportToastContent';

const meta: Meta<typeof ImportToastContent> = {
  title: 'Components/ProtocolImport/ImportToastContent',
  component: ImportToastContent,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="w-64 rounded border p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Parsing: Story = {
  args: {
    phase: 'parsing',
    progress: 0,
  },
};

export const Validating: Story = {
  args: {
    phase: 'validating',
    progress: 16.7,
  },
};

export const CheckingDuplicates: Story = {
  args: {
    phase: 'checking-duplicates',
    progress: 33.3,
  },
};

export const ExtractingAssets: Story = {
  args: {
    phase: 'extracting-assets',
    progress: 50,
  },
};

export const UploadingAssets: Story = {
  args: {
    phase: 'uploading-assets',
    progress: 75,
  },
};

export const Saving: Story = {
  args: {
    phase: 'saving',
    progress: 83.3,
  },
};

export const ErrorWithRetry: Story = {
  args: {
    phase: 'error',
    progress: 0,
    error: 'Protocol already exists. Delete the existing protocol first.',
    onRetry: fn(),
  },
};

export const ErrorWithoutRetry: Story = {
  args: {
    phase: 'error',
    progress: 0,
    error: 'The uploaded file does not contain a valid protocol.',
  },
};

export const Complete: Story = {
  args: {
    phase: 'complete',
    progress: 100,
  },
};
