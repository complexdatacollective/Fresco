import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  CheckCircle,
  Info,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './Alert';

const iconMap = {
  default: undefined,
  info: Info,
  checkCircle: CheckCircle,
  alertCircle: AlertCircle,
  alertTriangle: AlertTriangle,
  bell: Bell,
  none: false as const,
};

const meta = {
  title: 'Components/Alert',
  component: Alert,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'info', 'success', 'warning', 'destructive'],
      description: 'The visual style variant of the alert',
    },
    icon: {
      control: 'select',
      options: Object.keys(iconMap),
      mapping: iconMap,
      description: 'Custom icon to display. Use "none" to hide icon entirely.',
    },
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: 'default',
  },
  render: (args) => (
    <Alert {...args}>
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>
        You can add components to your app using the CLI.
      </AlertDescription>
    </Alert>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Alert variant="default">
        <AlertTitle>Default</AlertTitle>
        <AlertDescription>
          This is a default alert without any specific semantic meaning.
        </AlertDescription>
      </Alert>

      <Alert variant="info">
        <AlertTitle>Information</AlertTitle>
        <AlertDescription>
          This alert provides helpful information to the user.
        </AlertDescription>
      </Alert>

      <Alert variant="success">
        <AlertTitle>Success</AlertTitle>
        <AlertDescription>
          Your changes have been saved successfully!
        </AlertDescription>
      </Alert>

      <Alert variant="warning">
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>
          Please review your changes before proceeding.
        </AlertDescription>
      </Alert>

      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          An error occurred while processing your request.
        </AlertDescription>
      </Alert>
    </div>
  ),
};

export const WithCustomIcons: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Alert variant="info" icon={Bell}>
        <AlertTitle>Custom Icon</AlertTitle>
        <AlertDescription>
          You can override the default icon with any Lucide icon.
        </AlertDescription>
      </Alert>

      <Alert variant="success" icon={CheckCircle}>
        <AlertTitle>Using CheckCircle</AlertTitle>
        <AlertDescription>
          This success alert uses a custom CheckCircle icon.
        </AlertDescription>
      </Alert>
    </div>
  ),
};

export const WithoutIcons: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Alert variant="info" icon={false}>
        <AlertTitle>No Icon</AlertTitle>
        <AlertDescription>
          Set icon to false to hide the icon completely.
        </AlertDescription>
      </Alert>

      <Alert variant="warning" icon={false}>
        <AlertTitle>Warning Without Icon</AlertTitle>
        <AlertDescription>This works with any variant.</AlertDescription>
      </Alert>
    </div>
  ),
};

export const TitleOnly: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Alert variant="info">
        <AlertTitle>Quick info message</AlertTitle>
      </Alert>

      <Alert variant="success">
        <AlertTitle>Changes saved</AlertTitle>
      </Alert>
    </div>
  ),
};

export const DescriptionOnly: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Alert variant="info">
        <AlertDescription>
          A simple alert with just a description, no title.
        </AlertDescription>
      </Alert>

      <Alert variant="warning">
        <AlertDescription>
          Please check your internet connection and try again.
        </AlertDescription>
      </Alert>
    </div>
  ),
};

export const LongContent: Story = {
  render: () => (
    <Alert variant="info">
      <AlertTitle>Important Update</AlertTitle>
      <AlertDescription>
        We&apos;ve made significant changes to our terms of service. Please take
        a moment to review the updated terms. Your continued use of our service
        constitutes acceptance of these changes. If you have any questions or
        concerns, please don&apos;t hesitate to contact our support team.
        We&apos;re here to help you understand these changes and ensure your
        experience remains positive.
      </AlertDescription>
    </Alert>
  ),
};

export const WithLinks: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Alert variant="info">
        <AlertTitle>New Feature Available</AlertTitle>
        <AlertDescription>
          We&apos;ve added a new export feature.{' '}
          <a href="#" className="font-medium underline">
            Learn more
          </a>{' '}
          about how to use it.
        </AlertDescription>
      </Alert>

      <Alert variant="warning">
        <AlertTitle>Action Required</AlertTitle>
        <AlertDescription>
          Your subscription expires soon.{' '}
          <a href="#" className="font-medium underline">
            Renew now
          </a>{' '}
          to avoid interruption.
        </AlertDescription>
      </Alert>
    </div>
  ),
};

export const RealWorldExamples: Story = {
  name: 'Real-World Examples',
  render: () => (
    <div className="flex flex-col gap-4">
      <Alert variant="info">
        <AlertTitle>Interview in Progress</AlertTitle>
        <AlertDescription>
          The participant has not yet completed the interview. Data will be
          automatically saved as they progress.
        </AlertDescription>
      </Alert>

      <Alert variant="success">
        <AlertTitle>Export Complete</AlertTitle>
        <AlertDescription>
          Your network data has been successfully exported. Check your downloads
          folder for the CSV file.
        </AlertDescription>
      </Alert>

      <Alert variant="warning">
        <AlertTitle>Unsaved Changes</AlertTitle>
        <AlertDescription>
          You have unsaved changes to this protocol. Make sure to save before
          navigating away.
        </AlertDescription>
      </Alert>

      <Alert variant="destructive">
        <AlertTitle>Upload Failed</AlertTitle>
        <AlertDescription>
          There was an error uploading your protocol file. Please check the file
          format and try again.
        </AlertDescription>
      </Alert>
    </div>
  ),
};

export const AccessibilityDemo: Story = {
  name: 'Accessibility Features',
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border p-4">
        <h3 className="mb-2 font-semibold">Accessibility Features:</h3>
        <ul className="ml-6 list-disc space-y-1 text-sm">
          <li>
            <code>{'role="alert"'}</code> - Announces the alert to screen
            readers
          </li>
          <li>
            <code>{'aria-live="assertive"'}</code> - For destructive/error
            alerts, interrupts immediately
          </li>
          <li>
            <code>{'aria-live="polite"'}</code> - For info/success/warning,
            announces when user is idle
          </li>
          <li>
            <code>{'aria-atomic="true"'}</code> - Entire alert is read when
            updated
          </li>
          <li>
            <code>aria-label</code> - Provides semantic meaning (Information,
            Success, Error, Warning, Notice)
          </li>
          <li>
            <code>{'aria-hidden="true"'}</code> on icons - Prevents redundant
            announcements
          </li>
        </ul>
      </div>

      <Alert variant="destructive">
        <AlertTitle>Critical Error</AlertTitle>
        <AlertDescription>
          Destructive alerts use aria-live=&quot;assertive&quot; for immediate
          announcement.
        </AlertDescription>
      </Alert>

      <Alert variant="info">
        <AlertTitle>Informational</AlertTitle>
        <AlertDescription>
          Info alerts use aria-live=&quot;polite&quot; and wait for user to be
          idle.
        </AlertDescription>
      </Alert>
    </div>
  ),
};
