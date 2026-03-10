'use client';

import { Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { type ReactNode, useCallback, useMemo, useRef, useState } from 'react';
import { Button } from '~/components/ui/Button';
import Pips from '~/components/ui/Pips';
import { type WizardDialog } from '~/lib/dialogs/DialogProvider';
import {
  type BeforeNextHandler,
  WizardContext,
  type WizardContextType,
} from '~/lib/dialogs/useWizard';

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
  const [data, setData] = useState<Record<string, unknown>>({});
  const [nextEnabled, setNextEnabled] = useState(true);
  const [backEnabled, setBackEnabled] = useState(true);
  const [nextLabelOverride, setNextLabelOverride] = useState<string | null>(
    null,
  );
  const [isNextLoading, setIsNextLoading] = useState(false);

  const beforeNextRef = useRef<BeforeNextHandler | null>(null);
  const prevStepRef = useRef(stepIndex);
  const dataRef = useRef(data);
  dataRef.current = data;

  const currentStep = dialog.steps[stepIndex];
  const totalSteps = dialog.steps.length;

  const findNextUnskipped = useCallback(
    (from: number, dir: 'forward' | 'backward'): number | null => {
      const delta = dir === 'forward' ? 1 : -1;
      let candidate = from + delta;
      while (candidate >= 0 && candidate < totalSteps) {
        const step = dialog.steps[candidate];
        if (!step?.skip?.(dataRef.current)) return candidate;
        candidate += delta;
      }
      return null;
    },
    [dialog.steps, totalSteps],
  );

  const activeStepCount = useMemo(() => {
    return dialog.steps.filter((s) => !s.skip?.(data)).length;
  }, [dialog.steps, data]);

  const activeStepIndex = useMemo(() => {
    let idx = 0;
    for (let i = 0; i < stepIndex; i++) {
      if (!dialog.steps[i]?.skip?.(data)) idx++;
    }
    return idx;
  }, [dialog.steps, data, stepIndex]);

  const isFirstActive = findNextUnskipped(-1, 'forward') === stepIndex;
  const isLastActive = findNextUnskipped(totalSteps, 'backward') === stepIndex;

  const resetStepOverrides = useCallback(() => {
    setNextEnabled(true);
    setBackEnabled(true);
    setNextLabelOverride(null);
    beforeNextRef.current = null;
  }, []);

  const goToStep = useCallback(
    (target: number) => {
      if (target < 0 || target >= totalSteps) return;
      prevStepRef.current = stepIndex;
      resetStepOverrides();
      setStepIndex(target);
    },
    [stepIndex, totalSteps, resetStepOverrides],
  );

  const handleNext = useCallback(async () => {
    const handler = beforeNextRef.current;

    if (handler) {
      setIsNextLoading(true);
      try {
        const result = await handler();
        if (result === false) return;
      } catch {
        return;
      } finally {
        setIsNextLoading(false);
      }
    }

    if (isLastActive) {
      const result = dialog.onFinish ? dialog.onFinish(data) : data;
      await closeDialog(dialogId, result);
      return;
    }

    const next = findNextUnskipped(stepIndex, 'forward');
    if (next !== null) goToStep(next);
  }, [
    isLastActive,
    dialog,
    data,
    closeDialog,
    dialogId,
    goToStep,
    stepIndex,
    findNextUnskipped,
  ]);

  const handleBack = useCallback(() => {
    const prev = findNextUnskipped(stepIndex, 'backward');
    if (prev !== null) goToStep(prev);
  }, [goToStep, stepIndex, findNextUnskipped]);

  const handleCancel = useCallback(() => {
    void closeDialog(dialogId, null);
  }, [closeDialog, dialogId]);

  const setStepData = useCallback((stepData: Record<string, unknown>) => {
    setData((prev) => ({ ...prev, ...stepData }));
  }, []);

  const setBeforeNext = useCallback((handler: BeforeNextHandler | null) => {
    beforeNextRef.current = handler;
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
      setBeforeNext,
      goToStep,
    }),
    [stepIndex, totalSteps, data, setStepData, setBeforeNext, goToStep],
  );

  if (!currentStep) return null;

  const ProgressComponent = dialog.progress;
  const StepContent = currentStep.content;

  const nextLabel =
    nextLabelOverride ??
    currentStep.nextLabel ??
    (isLastActive ? 'Finish' : 'Continue');

  const showBackButton = !isFirstActive;

  return {
    title: currentStep.title,
    description: currentStep.description,
    children: (
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          layout
          key={stepIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
        >
          <WizardContext.Provider value={wizardContext}>
            <StepContent />
          </WizardContext.Provider>
        </motion.div>
      </AnimatePresence>
    ),
    footer: (
      <div className="flex grow flex-col gap-4">
        {ProgressComponent ? (
          <div className="flex flex-1 justify-center">
            <ProgressComponent
              currentStep={activeStepIndex}
              totalSteps={activeStepCount}
            />
          </div>
        ) : (
          activeStepCount > 1 && (
            <div className="flex flex-1 justify-center">
              <Pips
                count={activeStepCount}
                currentIndex={activeStepIndex}
                small
              />
            </div>
          )
        )}
        <div className="flex gap-2">
          <Button className="me-auto" onClick={handleCancel}>
            Cancel
          </Button>

          {showBackButton && (
            <Button
              onClick={handleBack}
              disabled={isFirstActive || !backEnabled}
            >
              {currentStep.backLabel ?? 'Back'}
            </Button>
          )}
          <Button
            color="primary"
            onClick={() => void handleNext()}
            disabled={!nextEnabled || isNextLoading}
          >
            {isNextLoading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              nextLabel
            )}
          </Button>
        </div>
      </div>
    ),
  };
}
