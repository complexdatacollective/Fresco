'use client';

import { Toast, type ToastObject } from '@base-ui/react/toast';
import { AlertCircle, CheckCircle, Info, type LucideIcon } from 'lucide-react';
import {
  createContext,
  type FocusEvent,
  type ReactNode,
  type RefObject,
  useCallback,
  useContext,
  useRef,
} from 'react';
import Paragraph from '~/components/typography/Paragraph';
import CloseButton from '~/components/ui/CloseButton';
import { type ToastVariant } from '~/components/ui/Toast';
import { cva, cx } from '~/utils/cva';
import { interviewToastManager } from '~/lib/interviewer/components/interviewToastManager';

type InterviewToastContextValue = {
  forwardButtonRef: RefObject<HTMLButtonElement | null>;
  backButtonRef: RefObject<HTMLButtonElement | null>;
  orientation: 'vertical' | 'horizontal';
};

const InterviewToastContext = createContext<InterviewToastContextValue | null>(
  null,
);

export function useInterviewToastContext() {
  return useContext(InterviewToastContext);
}

const interviewToastVariants = cva({
  base: 'publish-colors rounded border bg-clip-padding p-4 shadow-lg',
  variants: {
    variant: {
      default: 'bg-surface text-surface-contrast border-outline',
      info: 'bg-info text-info-contrast border-info',
      success: 'bg-success text-success-contrast border-success',
      destructive:
        'bg-destructive text-destructive-contrast border-destructive',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const arrowVariants = cva({
  base: 'size-2.5 rotate-45 rounded-br-sm data-[side=bottom]:-top-[5px] data-[side=left]:-right-[5px] data-[side=right]:-left-[5px] data-[side=top]:-bottom-[5px]',
  variants: {
    variant: {
      default: 'bg-surface',
      info: 'bg-info',
      success: 'bg-success',
      destructive: 'bg-destructive',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const variantIcons: Record<ToastVariant, LucideIcon | null> = {
  default: null,
  info: Info,
  success: CheckCircle,
  destructive: AlertCircle,
};

function InterviewToastItem({ toast }: { toast: ToastObject<object> }) {
  const variant = (toast.type ?? 'default') as ToastVariant;
  const IconComponent = variantIcons[variant];

  const hasFocusedRef = useRef(false);

  const focusRef = useCallback((node: HTMLElement | null) => {
    if (node) {
      node.focus();
    }
  }, []);

  const handleFocus = useCallback(() => {
    hasFocusedRef.current = true;
  }, []);

  const handleBlur = useCallback(
    (e: FocusEvent<HTMLElement>) => {
      if (
        hasFocusedRef.current &&
        !e.currentTarget.contains(e.relatedTarget)
      ) {
        interviewToastManager.close(toast.id);
      }
    },
    [toast.id],
  );

  if (toast.positionerProps) {
    return (
      <Toast.Root toast={toast} ref={focusRef} onFocus={handleFocus} onBlur={handleBlur}>
        <Toast.Positioner
          toast={toast}
          {...toast.positionerProps}
          sideOffset={12}
        >
          <Toast.Content
            className={cx(
              interviewToastVariants({ variant }),
              'animate-shake pointer-events-auto flex max-w-72 items-start gap-3',
            )}
          >
            {IconComponent && (
              <IconComponent
                className="mt-[0.1em] h-5 w-5 shrink-0"
                aria-hidden="true"
              />
            )}
            <Toast.Description
              render={<Paragraph margin="none" className="flex-1" />}
            />
            <Toast.Close
              render={<CloseButton size="sm" />}
              aria-label="Close"
              nativeButton
            />
          </Toast.Content>
          <Toast.Arrow
            className={cx(arrowVariants({ variant }), 'animate-shake')}
          />
        </Toast.Positioner>
      </Toast.Root>
    );
  }

  return (
    <Toast.Root toast={toast} ref={focusRef} onFocus={handleFocus} onBlur={handleBlur}>
      <Toast.Content
        className={cx(
          interviewToastVariants({ variant }),
          'pointer-events-auto flex max-w-72 items-start gap-3',
        )}
      >
        {IconComponent && (
          <IconComponent
            className="mt-[0.1em] h-5 w-5 shrink-0"
            aria-hidden="true"
          />
        )}
        <Toast.Description
          render={<Paragraph margin="none" className="flex-1" />}
        />
        <Toast.Close
          render={<CloseButton size="sm" />}
          aria-label="Close"
          nativeButton
        />
      </Toast.Content>
    </Toast.Root>
  );
}

export function InterviewToastViewport() {
  const { toasts } = Toast.useToastManager();

  return (
    <Toast.Portal>
      <Toast.Viewport className="pointer-events-none fixed inset-0 z-50">
        {toasts.map((toast) => (
          <InterviewToastItem key={toast.id} toast={toast} />
        ))}
      </Toast.Viewport>
    </Toast.Portal>
  );
}

type InterviewToastProviderProps = {
  children: ReactNode;
  forwardButtonRef: RefObject<HTMLButtonElement | null>;
  backButtonRef: RefObject<HTMLButtonElement | null>;
  orientation: 'vertical' | 'horizontal';
};

/**
 * Provides button refs and orientation context for interview toast positioning.
 * Does NOT wrap in Toast.Provider — that is handled as a sibling provider in
 * the app-level Providers component to avoid nested providers.
 */
export function InterviewToastProvider({
  children,
  forwardButtonRef,
  backButtonRef,
  orientation,
}: InterviewToastProviderProps) {
  return (
    <InterviewToastContext.Provider
      value={{ forwardButtonRef, backButtonRef, orientation }}
    >
      {children}
    </InterviewToastContext.Provider>
  );
}
