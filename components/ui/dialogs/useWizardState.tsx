'use client';

import { Loader2 } from 'lucide-react';
import { type ReactNode, useCallback, useMemo, useRef, useState } from 'react';
import { Button } from '~/components/ui/Button';
import Pips from '~/components/ui/Pips';
import {
  type GetFieldValue,
  type WizardDialog,
} from '~/components/ui/dialogs/DialogProvider';
import {
  type BeforeNextHandler,
  WizardContext,
  type WizardContextType,
} from '~/components/ui/dialogs/useWizard';

type UseWizardStateArgs = {
  dialog: WizardDialog;
  dialogId: string;
  closeDialog: (id: string, value: unknown) => Promise<void>;
  getFieldValue: GetFieldValue;
  validateForm: () => Promise<boolean>;
  getFieldErrors: () => Record<string, string[] | undefined>;
  getFormValues: () => Record<string, unknown>;
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
  getFieldValue,
  validateForm,
  getFieldErrors,
  getFormValues,
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
        if (!step?.skip?.({ data: dataRef.current, getFieldValue }))
          return candidate;
        candidate += delta;
      }
      return null;
    },
    [dialog.steps, totalSteps, getFieldValue],
  );

  const isFirstActive = findNextUnskipped(stepIndex, 'backward') === null;
  const isLastActive = findNextUnskipped(stepIndex, 'forward') === null;

  const showProgress =
    dialog.progress !== undefined ? dialog.progress !== null : true;

  const activeStepCount = useMemo(() => {
    if (!showProgress) return 0;
    return dialog.steps.filter((s) => !s.skip?.({ data, getFieldValue }))
      .length;
  }, [dialog.steps, data, getFieldValue, showProgress]);

  const activeStepIndex = useMemo(() => {
    if (!showProgress) return 0;
    let idx = 0;
    for (let i = 0; i < stepIndex; i++) {
      if (!dialog.steps[i]?.skip?.({ data, getFieldValue })) idx++;
    }
    return idx;
  }, [dialog.steps, data, stepIndex, getFieldValue, showProgress]);

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
      requestAnimationFrame(() => {
        document
          .querySelector('[role="dialog"] .scroll-area-viewport')
          ?.scrollTo(0, 0);
      });
    },
    [stepIndex, totalSteps, resetStepOverrides],
  );

  const handleNext = useCallback(async () => {
    setIsNextLoading(true);
    try {
      // Validate all currently registered form fields
      const isFormValid = await validateForm();
      if (!isFormValid) {
        const fieldErrors = getFieldErrors();
        const firstErrorField = Object.keys(fieldErrors)[0];
        if (firstErrorField) {
          const el = document.querySelector(
            `[data-field-name="${CSS.escape(firstErrorField)}"]`,
          );
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }

      // Run step-specific beforeNext handler if registered
      const handler = beforeNextRef.current;
      if (handler) {
        const result = await handler();
        if (result === false) return;
      }
    } catch {
      return;
    } finally {
      setIsNextLoading(false);
    }

    const next = findNextUnskipped(stepIndex, 'forward');
    if (next === null) {
      const formValues = { ...dataRef.current, ...getFormValues() };
      const result = dialog.onFinish ? dialog.onFinish(formValues) : formValues;
      await closeDialog(dialogId, result);
      return;
    }

    goToStep(next);
  }, [
    dialog,
    closeDialog,
    dialogId,
    goToStep,
    stepIndex,
    findNextUnskipped,
    validateForm,
    getFieldErrors,
    getFormValues,
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
      <WizardContext.Provider value={wizardContext}>
        <StepContent />
      </WizardContext.Provider>
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
          showProgress &&
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
        <div className="phone-landscape:flex-row phone-landscape:justify-between flex flex-col gap-2">
          <Button onClick={handleCancel}>Cancel</Button>

          <div className="phone-landscape:flex-row phone-landscape:justify-between flex flex-col gap-2">
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
      </div>
    ),
  };
}
