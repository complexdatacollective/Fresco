'use client';

import { Toast, type ToastObject } from '@base-ui/react/toast';
import { AlertCircle, CheckCircle, Info, type LucideIcon } from 'lucide-react';
import {
  createContext,
  type ReactNode,
  type RefObject,
  useContext,
} from 'react';
import Paragraph from '~/components/typography/Paragraph';
import CloseButton from '~/components/ui/CloseButton';
import { type ToastVariant } from '~/components/ui/Toast';
import { cva, cx } from '~/utils/cva';

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

const variantIcons: Record<ToastVariant, LucideIcon | null> = {
  default: null,
  info: Info,
  success: CheckCircle,
  destructive: AlertCircle,
};

function InterviewToastItem({ toast }: { toast: ToastObject<object> }) {
  const variant = (toast.type ?? 'default') as ToastVariant;
  const IconComponent = variantIcons[variant];

  return (
    <Toast.Root toast={toast} className="relative">
      {toast.positionerProps ? (
        <Toast.Positioner
          toast={toast}
          {...toast.positionerProps}
          sideOffset={12}
        >
          <Toast.Content
            className={cx(
              interviewToastVariants({ variant }),
              'flex max-w-72 items-start gap-3',
            )}
          >
            {IconComponent && (
              <IconComponent
                className="mt-[0.1em] h-5 w-5 shrink-0"
                aria-hidden="true"
              />
            )}
            <Toast.Description render={<Paragraph className="flex-1" />} />
            <Toast.Close
              render={<CloseButton size="sm" />}
              aria-label="Close"
              nativeButton
            />
          </Toast.Content>
        </Toast.Positioner>
      ) : (
        <Toast.Content
          className={cx(
            interviewToastVariants({ variant }),
            'flex max-w-72 items-start gap-3',
          )}
        >
          {IconComponent && (
            <IconComponent
              className="mt-[0.1em] h-5 w-5 shrink-0"
              aria-hidden="true"
            />
          )}
          <Toast.Description render={<Paragraph className="flex-1" />} />
          <Toast.Close
            render={<CloseButton size="sm" />}
            aria-label="Close"
            nativeButton
          />
        </Toast.Content>
      )}
    </Toast.Root>
  );
}

function InterviewToastViewport() {
  const { toasts } = Toast.useToastManager();

  return (
    <Toast.Viewport className="pointer-events-none fixed inset-0 z-50">
      {toasts.map((toast) => (
        <InterviewToastItem key={toast.id} toast={toast} />
      ))}
    </Toast.Viewport>
  );
}

type InterviewToastProviderProps = {
  children: ReactNode;
  forwardButtonRef: RefObject<HTMLButtonElement | null>;
  backButtonRef: RefObject<HTMLButtonElement | null>;
  orientation: 'vertical' | 'horizontal';
};

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
      <Toast.Provider limit={3}>
        {children}
        <InterviewToastViewport />
      </Toast.Provider>
    </InterviewToastContext.Provider>
  );
}
