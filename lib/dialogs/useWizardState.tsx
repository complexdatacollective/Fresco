'use client';

import { AnimatePresence, motion } from 'motion/react';
import { type ReactNode, useCallback, useMemo, useRef, useState } from 'react';
import Pips from '~/components/ui/Pips';
import { Button } from '~/components/ui/Button';
import { type WizardDialog } from '~/lib/dialogs/DialogProvider';
import { WizardContext, type WizardContextType } from '~/lib/dialogs/useWizard';

const slideVariants = {
  enter: (direction: 'forward' | 'backward') => ({
    x: direction === 'forward' ? '100%' : '-100%',
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: 'forward' | 'backward') => ({
    x: direction === 'forward' ? '-100%' : '100%',
    opacity: 0,
  }),
};

type UseWizardStateArgs = {
  dialog: WizardDialog;
  dialogId: string;
  closeDialog: (id: string, value: unknown) => Promise<void>;
};

type WizardDialogProps = {
  title: string;
  description: string | undefined;
  children: ReactNode;
  footer: ReactNode;
};

export default function useWizardState({
  dialog,
  dialogId,
  closeDialog,
}: UseWizardStateArgs): WizardDialogProps | null {
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [data, setData] = useState<Record<string, unknown>>({});
  const [nextEnabled, setNextEnabled] = useState(true);
  const [backEnabled, setBackEnabled] = useState(true);
  const [nextLabelOverride, setNextLabelOverride] = useState<string | null>(
    null,
  );

  const prevStepRef = useRef(stepIndex);

  const currentStep = dialog.steps[stepIndex];
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === dialog.steps.length - 1;
  const totalSteps = dialog.steps.length;

  const resetStepOverrides = useCallback(() => {
    setNextEnabled(true);
    setBackEnabled(true);
    setNextLabelOverride(null);
  }, []);

  const goToStep = useCallback(
    (target: number) => {
      if (target < 0 || target >= totalSteps) return;
      const newDirection = target > stepIndex ? 'forward' : 'backward';
      setDirection(newDirection);
      prevStepRef.current = stepIndex;
      resetStepOverrides();
      setStepIndex(target);
    },
    [stepIndex, totalSteps, resetStepOverrides],
  );

  const handleNext = useCallback(async () => {
    if (isLastStep) {
      const result = dialog.onFinish ? dialog.onFinish(data) : data;
      await closeDialog(dialogId, result);
      return;
    }
    goToStep(stepIndex + 1);
  }, [isLastStep, dialog, data, closeDialog, dialogId, goToStep, stepIndex]);

  const handleBack = useCallback(() => {
    goToStep(stepIndex - 1);
  }, [goToStep, stepIndex]);

  const handleCancel = useCallback(() => {
    void closeDialog(dialogId, null);
  }, [closeDialog, dialogId]);

  const setStepData = useCallback((stepData: Record<string, unknown>) => {
    setData((prev) => ({ ...prev, ...stepData }));
  }, []);

  const wizardContext = useMemo<WizardContextType>(
    () => ({
      currentStep: stepIndex,
      totalSteps,
      data,
      setStepData,
      setNextEnabled,
      setBackEnabled: (enabled: boolean) => setBackEnabled(enabled),
      setNextLabel: (label: string) => setNextLabelOverride(label),
      goToStep,
    }),
    [stepIndex, totalSteps, data, setStepData, goToStep],
  );

  if (!currentStep) return null;

  const ProgressComponent = dialog.progress;
  const StepContent = currentStep.content;

  const nextLabel =
    nextLabelOverride ??
    currentStep.nextLabel ??
    (isLastStep ? 'Finish' : 'Continue');

  const showBackButton = !isFirstStep;

  return {
    title: currentStep.title,
    description: currentStep.description,
    children: (
      <>
        {ProgressComponent ? (
          <ProgressComponent currentStep={stepIndex} totalSteps={totalSteps} />
        ) : (
          totalSteps > 1 && (
            <div className="py-2">
              <Pips count={totalSteps} currentIndex={stepIndex} small />
            </div>
          )
        )}
        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={stepIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2, ease: 'easeInOut' }}
            >
              <WizardContext.Provider value={wizardContext}>
                <StepContent />
              </WizardContext.Provider>
            </motion.div>
          </AnimatePresence>
        </div>
      </>
    ),
    footer: (
      <>
        <Button className="me-auto" onClick={handleCancel}>
          Cancel
        </Button>
        {showBackButton && (
          <Button onClick={handleBack} disabled={isFirstStep || !backEnabled}>
            {currentStep.backLabel ?? 'Back'}
          </Button>
        )}
        <Button
          color="primary"
          onClick={() => void handleNext()}
          disabled={!nextEnabled}
        >
          {nextLabel}
        </Button>
      </>
    ),
  };
}
