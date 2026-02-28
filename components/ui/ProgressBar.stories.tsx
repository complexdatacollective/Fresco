import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useEffect, useState } from 'react';
import ProgressBar from './ProgressBar';

const meta: Meta<typeof ProgressBar> = {
  title: 'Components/ProgressBar',
  component: ProgressBar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: 'Orientation of the progress bar',
      table: {
        type: { summary: "'horizontal' | 'vertical'" },
        defaultValue: { summary: "'vertical'" },
      },
    },
    percentProgress: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: 'Current progress percentage (0-100)',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '0' },
      },
    },
    indeterminate: {
      control: 'boolean',
      description: 'Whether progress is indeterminate',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    nudge: {
      control: 'boolean',
      description: 'Whether to show pulse glow animation when complete',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
      },
    },
    label: {
      control: 'text',
      description: 'Accessible label for the progress bar',
      table: {
        type: { summary: 'string' },
      },
    },
  },
  args: {
    orientation: 'vertical',
    percentProgress: 50,
    indeterminate: false,
    nudge: true,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    orientation: 'vertical',
    percentProgress: 50,
  },
  render: (args) => (
    <div
      className={
        args.orientation === 'vertical'
          ? 'flex h-96 items-center justify-center'
          : 'flex h-24 w-96 items-center justify-center'
      }
    >
      <ProgressBar {...args} />
    </div>
  ),
};

export const Indeterminate: Story = {
  args: {
    indeterminate: true,
    orientation: 'horizontal',
  },
  render: (args) => (
    <div className="flex h-24 w-96 items-center justify-center">
      <ProgressBar {...args} />
    </div>
  ),
};

export const Complete: Story = {
  args: {
    orientation: 'horizontal',
    percentProgress: 100,
    nudge: true,
  },
  render: (args) => (
    <div className="flex h-24 w-96 items-center justify-center">
      <ProgressBar {...args} />
    </div>
  ),
};

export const CompleteWithoutNudge: Story = {
  args: {
    orientation: 'horizontal',
    percentProgress: 100,
    nudge: false,
  },
  render: (args) => (
    <div className="flex h-24 w-96 items-center justify-center">
      <ProgressBar {...args} />
    </div>
  ),
};

export const AnimatedProgress: Story = {
  render: () => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            return 0;
          }
          return prev + 1;
        });
      }, 50);

      return () => clearInterval(interval);
    }, []);

    return (
      <div className="flex flex-col gap-8">
        <div className="flex flex-col items-center gap-4">
          <h3 className="text-lg font-semibold">Horizontal ({progress}%)</h3>
          <div className="flex h-24 w-96 items-center justify-center">
            <ProgressBar
              orientation="horizontal"
              percentProgress={progress}
              label="Animated horizontal progress"
            />
          </div>
        </div>
        <div className="flex flex-col items-center gap-4">
          <h3 className="text-lg font-semibold">Vertical ({progress}%)</h3>
          <div className="flex h-96 items-center justify-center">
            <ProgressBar
              orientation="vertical"
              percentProgress={progress}
              label="Animated vertical progress"
            />
          </div>
        </div>
      </div>
    );
  },
};

export const AllOrientations: Story = {
  render: () => (
    <div className="flex gap-12">
      <div className="flex flex-col items-center gap-4">
        <h3 className="text-base font-semibold">Vertical 25%</h3>
        <div className="flex h-96">
          <ProgressBar
            orientation="vertical"
            percentProgress={25}
            label="25% progress"
          />
        </div>
      </div>
      <div className="flex flex-col items-center gap-4">
        <h3 className="text-base font-semibold">Vertical 50%</h3>
        <div className="flex h-96">
          <ProgressBar
            orientation="vertical"
            percentProgress={50}
            label="50% progress"
          />
        </div>
      </div>
      <div className="flex flex-col items-center gap-4">
        <h3 className="text-base font-semibold">Vertical 75%</h3>
        <div className="flex h-96">
          <ProgressBar
            orientation="vertical"
            percentProgress={75}
            label="75% progress"
          />
        </div>
      </div>
      <div className="flex flex-col items-center gap-4">
        <h3 className="text-base font-semibold">Vertical 100%</h3>
        <div className="flex h-96">
          <ProgressBar
            orientation="vertical"
            percentProgress={100}
            label="Complete"
          />
        </div>
      </div>
    </div>
  ),
};

export const HorizontalVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold">25% Progress</h3>
        <div className="w-96">
          <ProgressBar
            orientation="horizontal"
            percentProgress={25}
            label="25% progress"
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold">50% Progress</h3>
        <div className="w-96">
          <ProgressBar
            orientation="horizontal"
            percentProgress={50}
            label="50% progress"
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold">75% Progress</h3>
        <div className="w-96">
          <ProgressBar
            orientation="horizontal"
            percentProgress={75}
            label="75% progress"
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold">100% Complete (with nudge)</h3>
        <div className="w-96">
          <ProgressBar
            orientation="horizontal"
            percentProgress={100}
            label="Complete"
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold">Indeterminate</h3>
        <div className="w-96">
          <ProgressBar orientation="horizontal" indeterminate label="Loading" />
        </div>
      </div>
    </div>
  ),
};

export const WithCustomColors: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold">Default Color (inherits)</h3>
        <div className="w-96">
          <ProgressBar
            orientation="horizontal"
            percentProgress={60}
            label="Default progress"
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold">
          Custom Color (via CSS variable)
        </h3>
        <div className="text-success w-96">
          <ProgressBar
            orientation="horizontal"
            percentProgress={60}
            label="Success progress"
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold">Warning Color</h3>
        <div className="text-warning w-96">
          <ProgressBar
            orientation="horizontal"
            percentProgress={60}
            label="Warning progress"
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold">Destructive Color</h3>
        <div className="text-destructive w-96">
          <ProgressBar
            orientation="horizontal"
            percentProgress={60}
            label="Destructive progress"
          />
        </div>
      </div>
    </div>
  ),
};
