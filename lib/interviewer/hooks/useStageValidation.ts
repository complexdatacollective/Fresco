'use client';

import { Toast, type ToastManagerPositionerProps } from '@base-ui/react/toast';
import {
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from 'react';
import { type ToastVariant } from '~/components/ui/Toast';
import { useInterviewToastContext } from '~/lib/interviewer/components/InterviewToast';
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
  const toastManager = Toast.useToastManager();

  const constraintsRef = useRef(constraints);
  constraintsRef.current = constraints;

  // Track active constraint toasts: constraint index → toast ID
  const activeToastsRef = useRef(new Map<number, string>());
  // Track previous isMet values for auto-close
  const prevIsMetRef = useRef<boolean[]>([]);

  const resolvePositionerProps = useCallback(
    (
      anchor: 'forward' | 'backward',
    ): ToastManagerPositionerProps | undefined => {
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

  const showToast = useCallback(
    (options: InterviewToastOptions): string => {
      const positionerProps = resolvePositionerProps(options.anchor);

      return toastManager.add({
        type: options.variant,
        description: options.description,
        timeout: options.timeout ?? 4000,
        positionerProps,
      });
    },
    [toastManager, resolvePositionerProps],
  );

  const closeToast = useCallback(
    (id: string) => {
      toastManager.close(id);
    },
    [toastManager],
  );

  // Auto-close toasts when constraints transition from unmet → met
  useEffect(() => {
    const prevValues = prevIsMetRef.current;
    const activeToasts = activeToastsRef.current;

    constraints.forEach((constraint, index) => {
      if (constraint.isMet && prevValues[index] === false) {
        const toastId = activeToasts.get(index);
        if (toastId) {
          toastManager.close(toastId);
          activeToasts.delete(index);
        }
      }
    });

    prevIsMetRef.current = constraints.map((c) => c.isMet);
  }, [constraints, toastManager]);

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
          // Only show toast if we don't already have one active for this constraint
          if (!activeToasts.has(i)) {
            const positionerProps = resolvePositionerProps(
              constraint.toast.anchor,
            );

            const toastId = toastManager.add({
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
        toastManager.close(toastId);
      }
      activeToasts.clear();
    };
  }, [registerBeforeNext, resolvePositionerProps, toastManager]);

  return { showToast, closeToast };
}

export default useStageValidation;
