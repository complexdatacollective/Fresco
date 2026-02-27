import { act, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { useWizard } from '../useWizard';
import DialogProvider from '../DialogProvider';
import useDialog from '../useDialog';
import { type WizardStep } from '../DialogProvider';

function SimpleStep() {
  const { setStepData } = useWizard();

  return (
    <button onClick={() => setStepData({ step1: 'done' })}>Set Data</button>
  );
}

function SecondStep() {
  const { data, setStepData } = useWizard();

  return (
    <div>
      <span data-testid="step1-data">
        {typeof data.step1 === 'string' ? data.step1 : ''}
      </span>
      <button onClick={() => setStepData({ step2: 'done' })}>Set Data 2</button>
    </div>
  );
}

function ThirdStep() {
  return <div>Step 3 content</div>;
}

function TestWizardComponent({
  onResult,
  onFinish,
  steps,
}: {
  onResult: (result: unknown) => void;
  onFinish?: (data: Record<string, unknown>) => unknown;
  steps?: WizardStep[];
}) {
  const { openDialog } = useDialog();

  const handleOpen = async () => {
    const result = await openDialog({
      type: 'wizard',
      title: 'Test Wizard',
      steps: steps ?? [
        { title: 'Step 1', content: SimpleStep },
        { title: 'Step 2', content: SecondStep },
      ],
      onFinish,
    });
    onResult(result);
  };

  return <button onClick={handleOpen}>Open</button>;
}

describe('useWizard hook', () => {
  it('should throw when used outside a wizard dialog', () => {
    expect(() => {
      renderHook(() => useWizard());
    }).toThrow('useWizard must be used within a wizard dialog');
  });
});

describe('Wizard Dialog', () => {
  const user = userEvent.setup();

  it('should open a wizard dialog and navigate between steps', async () => {
    const onResult = vi.fn();

    render(
      <DialogProvider>
        <TestWizardComponent onResult={onResult} />
      </DialogProvider>,
    );

    await user.click(screen.getByText('Open'));

    // Should show step 1
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();

    // Click Continue to go to step 2
    const continueButton = screen.getByRole('button', { name: 'Continue' });
    await user.click(continueButton);

    // Should now show step 2
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
    });

    // Click Finish on last step
    const finishButton = screen.getByRole('button', { name: 'Finish' });
    await user.click(finishButton);

    // Wait for animation timeout
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 600));
    });

    expect(onResult).toHaveBeenCalledWith({});
  });

  it('should accumulate data across steps', async () => {
    const onResult = vi.fn();

    render(
      <DialogProvider>
        <TestWizardComponent onResult={onResult} />
      </DialogProvider>,
    );

    await user.click(screen.getByText('Open'));
    await screen.findByRole('dialog');

    // Set data on step 1
    await user.click(screen.getByText('Set Data'));

    // Navigate to step 2
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
    });

    // Verify step 1 data persisted
    expect(screen.getByTestId('step1-data')).toHaveTextContent('done');

    // Set data on step 2
    await user.click(screen.getByText('Set Data 2'));

    // Finish
    await user.click(screen.getByRole('button', { name: 'Finish' }));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 600));
    });

    expect(onResult).toHaveBeenCalledWith({ step1: 'done', step2: 'done' });
  });

  it('should return null when cancelled', async () => {
    const onResult = vi.fn();

    render(
      <DialogProvider>
        <TestWizardComponent onResult={onResult} />
      </DialogProvider>,
    );

    await user.click(screen.getByText('Open'));
    await screen.findByRole('dialog');

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 600));
    });

    expect(onResult).toHaveBeenCalledWith(null);
  });

  it('should transform data with onFinish', async () => {
    const onResult = vi.fn();

    render(
      <DialogProvider>
        <TestWizardComponent
          onResult={onResult}
          onFinish={(data) => ({ transformed: true, ...data })}
        />
      </DialogProvider>,
    );

    await user.click(screen.getByText('Open'));
    await screen.findByRole('dialog');

    // Set data and navigate to last step
    await user.click(screen.getByText('Set Data'));
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
    });

    // Finish
    await user.click(screen.getByRole('button', { name: 'Finish' }));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 600));
    });

    expect(onResult).toHaveBeenCalledWith({
      transformed: true,
      step1: 'done',
    });
  });

  it('should not show Back button on first step', async () => {
    render(
      <DialogProvider>
        <TestWizardComponent onResult={vi.fn()} />
      </DialogProvider>,
    );

    await user.click(screen.getByText('Open'));
    await screen.findByRole('dialog');

    // Back button should not exist on step 1
    expect(
      screen.queryByRole('button', { name: 'Back' }),
    ).not.toBeInTheDocument();
  });

  it('should show Back button on subsequent steps', async () => {
    render(
      <DialogProvider>
        <TestWizardComponent onResult={vi.fn()} />
      </DialogProvider>,
    );

    await user.click(screen.getByText('Open'));
    await screen.findByRole('dialog');

    // Navigate to step 2
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
    });

    // Back button should be visible
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
  });
});

describe('Wizard Dialog with setNextEnabled', () => {
  const user = userEvent.setup();

  function DisabledNextStep() {
    const { setNextEnabled } = useWizard();
    const [name, setName] = useState('');

    return (
      <input
        aria-label="name"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          setNextEnabled(e.target.value.length > 0);
        }}
      />
    );
  }

  function TestDisabledNext({
    onResult,
  }: {
    onResult: (result: unknown) => void;
  }) {
    const { openDialog } = useDialog();

    const handleOpen = async () => {
      const result = await openDialog({
        type: 'wizard',
        title: 'Test',
        steps: [{ title: 'Step 1', content: DisabledNextStep }],
      });
      onResult(result);
    };

    return <button onClick={handleOpen}>Open</button>;
  }

  it('should disable Continue when setNextEnabled(false) is called', async () => {
    render(
      <DialogProvider>
        <TestDisabledNext onResult={vi.fn()} />
      </DialogProvider>,
    );

    await user.click(screen.getByText('Open'));
    await screen.findByRole('dialog');

    // Initially enabled (default)
    expect(screen.getByRole('button', { name: 'Finish' })).toBeEnabled();

    // Type something — enables next
    const input = screen.getByRole('textbox', { name: 'name' });
    await user.type(input, 'a');
    expect(screen.getByRole('button', { name: 'Finish' })).toBeEnabled();

    // Clear — disables next
    await user.clear(input);
    expect(screen.getByRole('button', { name: 'Finish' })).toBeDisabled();
  });
});

describe('Wizard Dialog resetStepOverrides', () => {
  const user = userEvent.setup();

  it('should reset nextEnabled when going back then forward', async () => {
    function StepThatDisablesNext() {
      const { setNextEnabled } = useWizard();

      return (
        <div>
          <button onClick={() => setNextEnabled(false)}>Disable</button>
          <button onClick={() => setNextEnabled(true)}>Enable</button>
        </div>
      );
    }

    render(
      <DialogProvider>
        <TestWizardComponent
          onResult={vi.fn()}
          steps={[
            { title: 'Step 1', content: SimpleStep },
            { title: 'Step 2', content: StepThatDisablesNext },
            { title: 'Step 3', content: ThirdStep },
          ]}
        />
      </DialogProvider>,
    );

    await user.click(screen.getByText('Open'));
    await screen.findByRole('dialog');

    // Navigate to step 2
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
    });

    // Disable next on step 2
    await user.click(screen.getByText('Disable'));
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();

    // Go back to step 1
    await user.click(screen.getByRole('button', { name: 'Back' }));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
    });

    // Next should be re-enabled (reset on navigation)
    expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled();

    // Navigate forward again — next should still be enabled (reset)
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
    });

    expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled();
  });
});

describe('Wizard Dialog single step', () => {
  const user = userEvent.setup();

  it('should show Finish instead of Continue for a single-step wizard', async () => {
    const onResult = vi.fn();

    render(
      <DialogProvider>
        <TestWizardComponent
          onResult={onResult}
          steps={[{ title: 'Only Step', content: SimpleStep }]}
        />
      </DialogProvider>,
    );

    await user.click(screen.getByText('Open'));
    await screen.findByRole('dialog');

    // Should show Finish, not Continue
    expect(
      screen.queryByRole('button', { name: 'Continue' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Finish' })).toBeInTheDocument();

    // Back button should not be present
    expect(
      screen.queryByRole('button', { name: 'Back' }),
    ).not.toBeInTheDocument();

    // Set data and finish
    await user.click(screen.getByText('Set Data'));
    await user.click(screen.getByRole('button', { name: 'Finish' }));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 600));
    });

    expect(onResult).toHaveBeenCalledWith({ step1: 'done' });
  });
});

describe('Wizard Dialog goToStep', () => {
  const user = userEvent.setup();

  function GoToStepControls() {
    const { goToStep, currentStep, totalSteps } = useWizard();

    return (
      <div>
        <span data-testid="current-step">{currentStep}</span>
        <button onClick={() => goToStep(-1)}>Go Negative</button>
        <button onClick={() => goToStep(totalSteps)}>Go Past End</button>
        <button onClick={() => goToStep(0)}>Go To 0</button>
        <button onClick={() => goToStep(2)}>Go To 2</button>
      </div>
    );
  }

  it('should ignore out-of-bounds goToStep calls', async () => {
    render(
      <DialogProvider>
        <TestWizardComponent
          onResult={vi.fn()}
          steps={[
            { title: 'Step 1', content: GoToStepControls },
            { title: 'Step 2', content: SimpleStep },
            { title: 'Step 3', content: ThirdStep },
          ]}
        />
      </DialogProvider>,
    );

    await user.click(screen.getByText('Open'));
    await screen.findByRole('dialog');

    expect(screen.getByTestId('current-step')).toHaveTextContent('0');

    // Negative index — should be ignored
    await user.click(screen.getByText('Go Negative'));
    expect(screen.getByTestId('current-step')).toHaveTextContent('0');

    // Past end — should be ignored
    await user.click(screen.getByText('Go Past End'));
    expect(screen.getByTestId('current-step')).toHaveTextContent('0');

    // Valid jump to step 2
    await user.click(screen.getByText('Go To 2'));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
    });

    // Should now be on step 3 (index 2), showing ThirdStep content
    expect(screen.getByText('Step 3 content')).toBeInTheDocument();
  });
});
