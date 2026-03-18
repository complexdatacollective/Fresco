import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useRef } from 'react';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';
import { Button } from './Button';
import { useToast, type ToastVariant } from './Toast';

const meta = {
  title: 'Components/Toast',
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
      <Heading level="h3" margin="none" className="text-lg">
        Basic Toast
      </Heading>
      <Paragraph margin="none" className="text-sm text-current/70">
        Click the button to create toasts. Hover over the stack to expand.
      </Paragraph>
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
      loading: {
        title: 'Loading',
        description: 'Processing your request...',
      },
    };

    add({
      ...messages[variant],
      type: variant,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <Heading level="h3" margin="none" className="text-lg">
        Toast Variants
      </Heading>
      <Paragraph margin="none" className="text-sm text-current/70">
        Different visual styles for different types of notifications.
      </Paragraph>
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
        <Button variant="outline" onClick={() => createToast('loading')}>
          Loading
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
    'loading',
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
      <Heading level="h3" margin="none" className="text-lg">
        Multiple Toasts
      </Heading>
      <Paragraph margin="none" className="text-sm text-current/70">
        Create multiple toasts to see how they stack. Hover over the stack to
        expand.
      </Paragraph>
      <Button onClick={createMultipleToasts}>Create Multiple Toasts</Button>
    </div>
  );
}

export const MultipleToasts: Story = {
  render: () => <MultipleToastsDemo />,
};

function LoadingDemo() {
  const { add, update } = useToast();

  const simulateExport = () => {
    const id = add({
      title: 'Exporting interviews',
      description: 'Fetching interview data...',
      type: 'loading',
      timeout: 0,
      onCancel: () => {
        // eslint-disable-next-line no-console
        console.log('Export cancelled');
      },
    });

    let current = 0;
    const total = 10;
    const interval = setInterval(() => {
      current++;
      if (current <= total) {
        update(id, {
          description: `Generating files... ${String(current)} / ${String(total)}`,
        });
      } else {
        clearInterval(interval);
        update(id, {
          title: 'Export complete!',
          description: 'Your download should start automatically.',
          type: 'success',
          timeout: 5000,
        });
      }
    }, 500);
  };

  return (
    <div className="flex flex-col gap-4">
      <Heading level="h3" margin="none" className="text-lg">
        Loading Toast (Export Progress)
      </Heading>
      <Paragraph margin="none" className="text-sm text-current/70">
        Simulates an export with progress updates, then transitions to success.
      </Paragraph>
      <Button onClick={simulateExport}>Simulate Export</Button>
    </div>
  );
}

export const Loading: Story = {
  render: () => <LoadingDemo />,
};
