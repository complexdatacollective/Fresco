'use client';

import {
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from 'react';
import { type ToastVariant } from '~/components/ui/Toast';
import { useInterviewToastContext } from '~/lib/interviewer/components/InterviewToast';
import { interviewToastManager } from '~/lib/interviewer/components/interviewToastManager';
import { StageMetadataContext } from '~/lib/interviewer/contexts/StageMetadataContext';
import { type Direction } from '~/lib/interviewer/types';

type StageConstraint = {
  direction: 'forwards' | 'backwards' | 'both';
  isMet: boolean;
  toast: {
    description: string | ReactNode;
    variant: ToastVariant;
    anchor: 'forward' | 'backward';
    timeout?: number;
  };
};

type InterviewToastOptions = {
  description: string | ReactNode;
  variant: ToastVariant;
  anchor: 'forward' | 'backward';
  timeout?: number;
};

type UseStageValidationOptions = {
  constraints: StageConstraint[];
};

function useStageValidation({ constraints }: UseStageValidationOptions) {
  const registerBeforeNext = useContext(StageMetadataContext);
  const toastContext = useInterviewToastContext();

  const constraintsRef = useRef(constraints);
  constraintsRef.current = constraints;

  // Track active constraint toasts: constraint index -> toast ID
  const activeToastsRef = useRef(new Map<number, string>());
  // Track previous isMet values for auto-close
  const prevIsMetRef = useRef<boolean[]>([]);

  const resolvePositionerProps = useCallback(
    (anchor: 'forward' | 'backward') => {
      if (!toastContext) return undefined;

      const { forwardButtonRef, backButtonRef, orientation } = toastContext;
      const anchorRef = anchor === 'forward' ? forwardButtonRef : backButtonRef;
      const side =
        orientation === 'vertical' ? ('right' as const) : ('top' as const);

      return {
        anchor: anchorRef.current,
        side,
      };
    },
    [toastContext],
  );

  const resolvePositionerPropsRef = useRef(resolvePositionerProps);
  resolvePositionerPropsRef.current = resolvePositionerProps;

  const showToast = useCallback((options: InterviewToastOptions): string => {
    const positionerProps = resolvePositionerPropsRef.current(options.anchor);

    return interviewToastManager.add({
      type: options.variant,
      description: options.description,
      timeout: options.timeout ?? 4000,
      positionerProps,
    });
  }, []);

  const closeToast = useCallback((id: string) => {
    interviewToastManager.close(id);
  }, []);

  // Auto-close toasts when constraints transition from unmet -> met
  useEffect(() => {
    const prevValues = prevIsMetRef.current;
    const activeToasts = activeToastsRef.current;

    constraints.forEach((constraint, index) => {
      if (constraint.isMet && prevValues[index] === false) {
        const toastId = activeToasts.get(index);
        if (toastId) {
          interviewToastManager.close(toastId);
          activeToasts.delete(index);
        }
      }
    });

    prevIsMetRef.current = constraints.map((c) => c.isMet);
  }, [constraints]);

  // Register the keyed beforeNext handler
  useEffect(() => {
    const handler = (direction: Direction) => {
      const currentConstraints = constraintsRef.current;
      const activeToasts = activeToastsRef.current;

      for (let i = 0; i < currentConstraints.length; i++) {
        const constraint = currentConstraints[i]!;
        const matchesDirection =
          constraint.direction === 'both' || constraint.direction === direction;

        if (matchesDirection && !constraint.isMet) {
          if (!activeToasts.has(i)) {
            const positionerProps = resolvePositionerPropsRef.current(
              constraint.toast.anchor,
            );

            const toastId = interviewToastManager.add({
              type: constraint.toast.variant,
              description: constraint.toast.description,
              timeout: constraint.toast.timeout ?? 4000,
              positionerProps,
              onRemove: () => {
                activeToasts.delete(i);
              },
            });

            activeToasts.set(i, toastId);
          }

          return false;
        }
      }

      return true;
    };

    registerBeforeNext('stageValidation', handler);

    const activeToasts = activeToastsRef.current;

    return () => {
      registerBeforeNext('stageValidation', null);

      for (const toastId of activeToasts.values()) {
        interviewToastManager.close(toastId);
      }
      activeToasts.clear();
    };
  }, [registerBeforeNext]);

  return { showToast, closeToast };
}

export default useStageValidation;
