import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useRef } from 'react';
import { Button } from '../Button';
import { Toaster, ToastProvider, useToastManager } from './Toast';

const meta = {
  title: 'UI/Toast',
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ToastProvider>
        <div className="relative min-h-[400px] w-full p-8">
          <Story />
        </div>
        <Toaster />
      </ToastProvider>
    ),
  ],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function BasicDemo() {
  const toastManager = useToastManager();
  const countRef = useRef(0);

  const createToast = () => {
    countRef.current += 1;
    toastManager.add({
      title: `Toast ${countRef.current}`,
      description: 'This is a toast notification.',
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-semibold">Basic Toast</h3>
      <p className="text-sm text-current/70">
        Click the button to create toasts. Hover over the stack to expand.
      </p>
      <Button onClick={createToast}>Create Toast</Button>
    </div>
  );
}

export const Default: Story = {
  render: () => <BasicDemo />,
};

function StackingDemo() {
  const toastManager = useToastManager();
  const countRef = useRef(0);

  const createMultiple = () => {
    for (let i = 0; i < 3; i++) {
      countRef.current += 1;
      toastManager.add({
        title: `Toast ${countRef.current}`,
        description: `This is toast number ${countRef.current}`,
      });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-semibold">Stacking Toasts</h3>
      <p className="text-sm text-current/70">
        Creates 3 toasts at once to demonstrate stacking. Hover over the stack
        to expand them into a list.
      </p>
      <Button onClick={createMultiple}>Create 3 Toasts</Button>
    </div>
  );
}

export const Stacking: Story = {
  name: 'Stacking',
  render: () => <StackingDemo />,
};
