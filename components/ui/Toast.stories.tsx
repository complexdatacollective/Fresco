import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useRef } from 'react';
import { Button } from './Button';
import { useToast, type ToastVariant } from './Toast';

const meta = {
  title: 'UI/Toast',
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function BasicDemo() {
  const { add } = useToast();
  const countRef = useRef(0);

  const createToast = () => {
    countRef.current += 1;
    add({
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

function VariantsDemo() {
  const { add } = useToast();

  const createToast = (variant: ToastVariant) => {
    const messages: Record<
      ToastVariant,
      { title: string; description: string }
    > = {
      default: {
        title: 'Default Toast',
        description: 'This is a default toast notification.',
      },
      info: {
        title: 'Information',
        description: 'Here is some helpful information.',
      },
      success: {
        title: 'Success',
        description: 'The operation completed successfully.',
      },
      destructive: {
        title: 'Error',
        description: 'Something went wrong. Please try again.',
      },
    };

    add({
      ...messages[variant],
      type: variant,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-semibold">Toast Variants</h3>
      <p className="text-sm text-current/70">
        Different visual styles for different types of notifications.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => createToast('default')}>
          Default
        </Button>
        <Button variant="outline" onClick={() => createToast('info')}>
          Info
        </Button>
        <Button variant="outline" onClick={() => createToast('success')}>
          Success
        </Button>
        <Button variant="outline" onClick={() => createToast('destructive')}>
          Destructive
        </Button>
      </div>
    </div>
  );
}

export const Variants: Story = {
  render: () => <VariantsDemo />,
};

function MultipleToastsDemo() {
  const { add } = useToast();
  const countRef = useRef(0);

  const variants: ToastVariant[] = [
    'default',
    'info',
    'success',
    'destructive',
  ];

  const createMultipleToasts = () => {
    variants.forEach((variant, index) => {
      setTimeout(() => {
        countRef.current += 1;
        add({
          title: `${variant.charAt(0).toUpperCase() + variant.slice(1)} Toast ${countRef.current}`,
          description: `This is a ${variant} notification.`,
          type: variant,
        });
      }, index * 300);
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-semibold">Multiple Toasts</h3>
      <p className="text-sm text-current/70">
        Create multiple toasts to see how they stack. Hover over the stack to
        expand.
      </p>
      <Button onClick={createMultipleToasts}>Create Multiple Toasts</Button>
    </div>
  );
}

export const MultipleToasts: Story = {
  render: () => <MultipleToastsDemo />,
};
