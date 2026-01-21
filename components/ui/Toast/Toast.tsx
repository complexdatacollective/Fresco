'use client';

import { Toast } from '@base-ui/react/toast';
import { X } from 'lucide-react';
import { type ReactNode } from 'react';
import { cx } from '~/utils/cva';

// Re-export Toast parts for external use
export const ToastProvider = Toast.Provider;
export const ToastPortal = Toast.Portal;
export const ToastViewport = Toast.Viewport;
export const ToastRoot = Toast.Root;
export const ToastContent = Toast.Content;
export const ToastTitle = Toast.Title;
export const ToastDescription = Toast.Description;
export const ToastClose = Toast.Close;
export const useToastManager = Toast.useToastManager;

// Types for backwards compatibility
export type ToastVariant = 'default' | 'success' | 'destructive';

type ToastOptions = {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  icon?: ReactNode;
  duration?: number;
};

// Simple useToast hook for backwards compatibility
export function useToast() {
  const manager = Toast.useToastManager();

  const toast = (options: ToastOptions) => {
    const { title, description, variant, duration } = options;
    const id = manager.add({
      title,
      description,
      type: variant,
      timeout: duration,
    });

    return {
      id,
      dismiss: () => manager.close(id),
      update: (newOptions: Partial<ToastOptions>) => {
        manager.update(id, {
          title: newOptions.title,
          description: newOptions.description,
          type: newOptions.variant,
        });
      },
    };
  };

  const dismiss = (id: string) => manager.close(id);

  return { toast, dismiss, toasts: manager.toasts };
}

// Styled toast list component
export function ToastList() {
  const { toasts } = Toast.useToastManager();

  return toasts.map((toast) => (
    <Toast.Root
      key={toast.id}
      toast={toast}
      className={cx(
        // Base styles
        'group bg-surface relative flex w-80 items-center gap-4 rounded border p-4 shadow-lg',
        // Stacking using CSS variables from Base-UI
        'z-[calc(1000-var(--toast-index))]',
        'scale-[calc(1-0.05*var(--toast-index))]',
        'translate-y-[calc(-8px*var(--toast-index))]',
        // Expanded state
        'data-[expanded]:scale-100',
        'data-[expanded]:translate-y-[var(--toast-offset-y)]',
        // Transitions
        'transition-all duration-200 ease-out',
        'origin-bottom',
      )}
    >
      <Toast.Content
        className={cx(
          'flex w-full flex-col gap-1',
          'transition-opacity duration-200',
          'data-[behind]:opacity-0',
        )}
      >
        <Toast.Title className="font-semibold" />
        <Toast.Description className="text-sm opacity-80" />
        <Toast.Close
          className={cx(
            'absolute top-2 right-2 rounded p-1',
            'opacity-0 transition-opacity group-hover:opacity-100',
          )}
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </Toast.Close>
      </Toast.Content>
    </Toast.Root>
  ));
}

// Complete toast setup component for easy usage
export function Toaster() {
  return (
    <Toast.Portal>
      <Toast.Viewport
        className={cx(
          'fixed right-0 bottom-0 z-50 flex flex-col-reverse p-4',
          'max-w-[420px]',
        )}
      >
        <ToastList />
      </Toast.Viewport>
    </Toast.Portal>
  );
}
