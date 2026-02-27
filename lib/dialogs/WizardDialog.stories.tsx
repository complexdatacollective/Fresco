import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import Button from '~/components/ui/Button';
import UnconnectedField from '~/lib/form/components/Field/UnconnectedField';
import InputField from '~/lib/form/components/fields/InputField';
import RadioGroupField from '~/lib/form/components/fields/RadioGroup';
import { useWizard } from '~/lib/dialogs/useWizard';
import useDialog from './useDialog';

function NameStep() {
  const { data, setStepData, setNextEnabled } = useWizard();
  const [name, setName] = useState((data.name as string) ?? '');

  return (
    <div className="flex flex-col gap-3 pt-4">
      <UnconnectedField
        label="Your name"
        component={InputField}
        placeholder="Enter your name..."
        value={name}
        onChange={(value) => {
          const v = value ?? '';
          setName(v);
          setStepData({ name: v });
          setNextEnabled(v.length > 0);
        }}
      />
    </div>
  );
}

const roleOptions = [
  { value: 'researcher', label: 'Researcher' },
  { value: 'admin', label: 'Admin' },
  { value: 'participant', label: 'Participant' },
];

function RoleStep() {
  const { data, setStepData } = useWizard();
  const [role, setRole] = useState((data.role as string) ?? 'researcher');

  return (
    <div className="flex flex-col gap-3 pt-4">
      <p className="text-sm">
        Welcome, <strong>{(data.name as string) ?? 'User'}</strong>! Choose your
        role:
      </p>
      <UnconnectedField
        label="Role"
        component={RadioGroupField}
        options={roleOptions}
        value={role}
        onChange={(value) => {
          const v =
            typeof value === 'string'
              ? value
              : typeof value === 'number'
                ? value.toString()
                : 'researcher';
          setRole(v);
          setStepData({ role: v });
        }}
      />
    </div>
  );
}

function ConfirmStep() {
  const { data } = useWizard();

  return (
    <div className="flex flex-col gap-3 pt-4">
      <p className="text-sm">Please confirm your details:</p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="font-medium">Name</dt>
        <dd data-testid="confirm-name">{(data.name as string) ?? '—'}</dd>
        <dt className="font-medium">Role</dt>
        <dd data-testid="confirm-role">{(data.role as string) ?? '—'}</dd>
      </dl>
    </div>
  );
}

type WizardStoryArgs = {
  onResult: (result: unknown) => void;
};

const meta: Meta = {
  title: 'Systems/Dialogs/Wizard',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

/**
 * A basic three-step wizard that collects a name and role,
 * then shows a confirmation step. The result is reported
 * via the `onResult` action in the Actions panel.
 */
export const Default: StoryObj<Meta<WizardStoryArgs>> = {
  args: {
    onResult: fn(),
  },
  render: (args) => {
    const { openDialog } = useDialog();

    const handleOpen = async () => {
      const result = await openDialog({
        type: 'wizard',
        title: 'Setup Wizard',
        steps: [
          {
            title: 'Enter your name',
            description: 'We need your name to get started.',
            content: NameStep,
          },
          {
            title: 'Choose a role',
            description: 'Select the role that best describes you.',
            content: RoleStep,
          },
          {
            title: 'Confirm',
            description: 'Review your details before completing setup.',
            content: ConfirmStep,
            nextLabel: 'Complete Setup',
          },
        ],
      });

      args.onResult(result);
    };

    return (
      <div className="flex h-screen items-center justify-center">
        <Button onClick={handleOpen}>Open Wizard</Button>
      </div>
    );
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Open the wizard
    await userEvent.click(canvas.getByRole('button', { name: 'Open Wizard' }));
    await screen.findByRole('dialog');

    // Step 1: Enter name — wait for dialog animation to finish
    const nameInput = await screen.findByRole('textbox', {}, { timeout: 5000 });
    await userEvent.type(nameInput, 'Alice');

    // Navigate to step 2
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    // Step 2: Select role — default is "researcher", change to "admin"
    const adminRadio = await screen.findByRole(
      'radio',
      { name: 'Admin' },
      { timeout: 5000 },
    );
    await userEvent.click(adminRadio);

    // Navigate to step 3
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    // Step 3: Confirm — verify accumulated data is displayed
    await waitFor(async () => {
      await expect(screen.getByTestId('confirm-name')).toHaveTextContent(
        'Alice',
      );
      await expect(screen.getByTestId('confirm-role')).toHaveTextContent(
        'admin',
      );
    });

    // Complete the wizard
    await userEvent.click(
      screen.getByRole('button', { name: 'Complete Setup' }),
    );

    // Verify the result was reported
    await waitFor(async () => {
      await expect(args.onResult).toHaveBeenCalledWith({
        name: 'Alice',
        role: 'admin',
      });
    });
  },
};

function DisableNextStep() {
  const { setNextEnabled } = useWizard();

  return (
    <div className="flex flex-col gap-3 pt-4">
      <p className="text-sm">
        Use the buttons below to toggle the Next button.
      </p>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => setNextEnabled(true)}>
          Enable Next
        </Button>
        <Button size="sm" onClick={() => setNextEnabled(false)}>
          Disable Next
        </Button>
      </div>
    </div>
  );
}

function DynamicLabelStep() {
  const { setNextLabel } = useWizard();
  const [label, setLabel] = useState('Continue');

  return (
    <div className="flex flex-col gap-3 pt-4">
      <UnconnectedField
        label="Custom next button label"
        component={InputField}
        value={label}
        onChange={(value) => {
          const v = value ?? '';
          setLabel(v);
          setNextLabel(v);
        }}
      />
    </div>
  );
}

function GoToStepDemo() {
  const { goToStep, totalSteps } = useWizard();

  return (
    <div className="flex flex-col gap-3 pt-4">
      <p className="text-sm">Jump to any step:</p>
      <div className="flex gap-2">
        {Array.from({ length: totalSteps }, (_, i) => (
          <Button key={i} size="sm" onClick={() => goToStep(i)}>
            Step {i + 1}
          </Button>
        ))}
      </div>
    </div>
  );
}

/**
 * Demonstrates interactive control of the wizard via `useWizard()`:
 * - `setNextEnabled` to toggle the Next button
 * - `setNextLabel` to change the button text dynamically
 * - `goToStep` to jump to any step directly
 */
export const InteractiveControls: StoryObj<Meta<WizardStoryArgs>> = {
  args: {
    onResult: fn(),
  },
  render: (args) => {
    const { openDialog } = useDialog();

    const handleOpen = async () => {
      const result = await openDialog({
        type: 'wizard',
        title: 'Interactive Controls',
        steps: [
          {
            title: 'Toggle Next Button',
            description: 'Control whether the Next button is enabled.',
            content: DisableNextStep,
          },
          {
            title: 'Dynamic Label',
            description: 'Change the Next button label dynamically.',
            content: DynamicLabelStep,
          },
          {
            title: 'Jump to Step',
            description: 'Navigate to any step directly.',
            content: GoToStepDemo,
          },
        ],
      });

      args.onResult(result);
    };

    return (
      <div className="flex h-screen items-center justify-center">
        <Button onClick={handleOpen}>Interactive Wizard</Button>
      </div>
    );
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Open the wizard
    await userEvent.click(
      canvas.getByRole('button', { name: 'Interactive Wizard' }),
    );
    await screen.findByRole('dialog');

    // Step 1: Verify disabling Next button works — wait for dialog animation
    const disableBtn = await screen.findByRole(
      'button',
      { name: 'Disable Next' },
      { timeout: 5000 },
    );
    await userEvent.click(disableBtn);
    await expect(
      screen.getByRole('button', { name: 'Continue' }),
    ).toBeDisabled();

    // Re-enable and proceed
    await userEvent.click(screen.getByRole('button', { name: 'Enable Next' }));
    await expect(
      screen.getByRole('button', { name: 'Continue' }),
    ).toBeEnabled();
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    // Step 2: Verify dynamic label
    const labelInput = await screen.findByRole('textbox');
    await userEvent.clear(labelInput);
    await userEvent.type(labelInput, 'Go!');

    await waitFor(async () => {
      await expect(screen.getByRole('button', { name: 'Go!' })).toBeVisible();
    });

    // Proceed to step 3
    await userEvent.click(screen.getByRole('button', { name: 'Go!' }));

    // Step 3: goToStep — jump back to step 1
    await waitFor(async () => {
      await expect(
        screen.getByRole('button', { name: 'Step 1' }),
      ).toBeVisible();
    });
    await userEvent.click(screen.getByRole('button', { name: 'Step 1' }));

    // Verify we're back on step 1
    await waitFor(async () => {
      await expect(
        screen.getByRole('button', { name: 'Disable Next' }),
      ).toBeVisible();
    });

    // Cancel the wizard
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(async () => {
      await expect(args.onResult).toHaveBeenCalledWith(null);
    });
  },
};

function CustomProgressIndicator({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  return (
    <div className="flex items-center gap-2 py-2 text-sm">
      <span className="font-medium" data-testid="progress-label">
        Step {currentStep + 1} of {totalSteps}
      </span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-current/10">
        <div
          className="bg-primary h-full rounded-full transition-all duration-300"
          style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
        />
      </div>
    </div>
  );
}

function PlaceholderStep() {
  return (
    <div className="flex items-center justify-center py-8 text-sm text-current/50">
      Step content goes here
    </div>
  );
}

/**
 * Demonstrates using a custom progress indicator component
 * instead of the default Pips.
 */
export const CustomProgress: StoryObj<Meta<WizardStoryArgs>> = {
  args: {
    onResult: fn(),
  },
  render: (args) => {
    const { openDialog } = useDialog();

    const handleOpen = async () => {
      const result = await openDialog({
        type: 'wizard',
        title: 'Custom Progress',
        steps: [
          {
            title: 'Step One',
            description: 'The first step with a progress bar.',
            content: PlaceholderStep,
          },
          {
            title: 'Step Two',
            description: 'The second step with a progress bar.',
            content: PlaceholderStep,
          },
          {
            title: 'Step Three',
            content: PlaceholderStep,
          },
          {
            title: 'Final Step',
            content: PlaceholderStep,
            nextLabel: 'Done',
          },
        ],
        progress: CustomProgressIndicator,
      });

      args.onResult(result);
    };

    return (
      <div className="flex h-screen items-center justify-center">
        <Button onClick={handleOpen}>Wizard with Progress Bar</Button>
      </div>
    );
  },
};

/**
 * Demonstrates the `onFinish` callback, which transforms
 * the accumulated data before resolving the dialog promise.
 * The transformed result is visible in the Actions panel.
 */
export const WithOnFinish: StoryObj<Meta<WizardStoryArgs>> = {
  args: {
    onResult: fn(),
  },
  render: (args) => {
    const { openDialog } = useDialog();

    const handleOpen = async () => {
      const result = await openDialog({
        type: 'wizard',
        title: 'Transform Result',
        steps: [
          {
            title: 'Enter your name',
            content: NameStep,
          },
          {
            title: 'Choose a role',
            content: RoleStep,
          },
        ],
        onFinish: (data: Record<string, unknown>) => ({
          displayName: `${String(data.name)} (${String(data.role)})`,
          timestamp: new Date().toISOString(),
        }),
      });

      args.onResult(result);
    };

    return (
      <div className="flex h-screen items-center justify-center">
        <Button onClick={handleOpen}>Wizard with onFinish</Button>
      </div>
    );
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Open the wizard
    await userEvent.click(
      canvas.getByRole('button', { name: 'Wizard with onFinish' }),
    );
    await screen.findByRole('dialog');

    // Step 1: Enter name — wait for dialog animation to finish
    const nameInput = await screen.findByRole('textbox', {}, { timeout: 5000 });
    await userEvent.type(nameInput, 'Bob');

    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    // Step 2: Select role — pick "participant"
    const participantRadio = await screen.findByRole(
      'radio',
      { name: 'Participant' },
      { timeout: 5000 },
    );
    await userEvent.click(participantRadio);

    // Finish
    await userEvent.click(screen.getByRole('button', { name: 'Finish' }));

    // Verify the onFinish transform was applied
    await waitFor(async () => {
      await expect(args.onResult).toHaveBeenCalledOnce();
      const result = (args.onResult as ReturnType<typeof fn>).mock
        .lastCall?.[0] as Record<string, unknown>;
      await expect(result.displayName).toBe('Bob (participant)');
      await expect(typeof result.timestamp).toBe('string');
    });
  },
};
