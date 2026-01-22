'use client';

import {
  Toast,
  type ToastObject,
  type UseToastManagerReturnValue,
} from '@base-ui/react/toast';
import { AlertCircle, CheckCircle, Info, type LucideIcon } from 'lucide-react';
import { cva, cx, type VariantProps } from '~/utils/cva';
import Heading from '../typography/Heading';
import Paragraph from '../typography/Paragraph';
import CloseButton from './CloseButton';

const toastVariants = cva({
  base: 'border bg-clip-padding',
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

export type ToastVariant = NonNullable<
  VariantProps<typeof toastVariants>['variant']
>;

const variantIcons: Record<ToastVariant, LucideIcon | null> = {
  default: null,
  info: Info,
  success: CheckCircle,
  destructive: AlertCircle,
};

type ToastData = {
  title: string;
  description?: string | React.ReactNode;
  variant?: ToastVariant;
  icon?: React.ReactNode;
  type?: ToastVariant;
  timeout?: number;
};

type ToastItemProps = {
  toast: ToastObject<{ variant?: ToastVariant }>;
};

function ToastItem({ toast }: ToastItemProps) {
  const variant = toast.data?.variant ?? 'default';
  const IconComponent = variantIcons[variant];

  return (
    <Toast.Root
      key={toast.id}
      toast={toast}
      className={cx(
        'focusable',
        '[--peek:0.75rem] [--scale:calc(max(0,1-(var(--toast-index)*0.1)))] [--shrink:calc(1-var(--scale))]',
        '[--gap:0.75rem] [--height:var(--toast-frontmost-height,var(--toast-height))] [--offset-y:calc(var(--toast-offset-y)*-1+calc(var(--toast-index)*var(--gap)*-1)+var(--toast-swipe-movement-y))]',
        'after:absolute after:top-full after:left-0 after:h-[calc(var(--gap)+1px)] after:w-full after:content-[""]',
        'mr-0 rounded p-4 shadow-lg select-none',
        'absolute right-0 bottom-0 left-auto',
        'z-[calc(1000-var(--toast-index))]',
        'h-(--height) w-full origin-bottom',
        '[transition:transform_0.5s_cubic-bezier(0.22,1,0.36,1),opacity_0.5s,height_0.15s] data-[ending-style]:opacity-0 data-[expanded]:[transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--offset-y)))] data-[limited]:opacity-0 data-[starting-style]:[transform:translateY(150%)] data-[ending-style]:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-movement-y)+150%))] data-[expanded]:data-[ending-style]:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-movement-y)+150%))] data-[ending-style]:data-[swipe-direction=left]:[transform:translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))] data-[expanded]:data-[ending-style]:data-[swipe-direction=left]:[transform:translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))] data-[ending-style]:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))] data-[expanded]:data-[ending-style]:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))] data-[ending-style]:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)-150%))] data-[expanded]:data-[ending-style]:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)-150%))] [&[data-ending-style]:not([data-limited]):not([data-swipe-direction])]:[transform:translateY(150%)]',
        '[transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-swipe-movement-y)-(var(--toast-index)*var(--peek))-(var(--shrink)*var(--height))))_scale(var(--scale))]',
        'data-[expanded]:h-[var(--toast-height)]',
        toastVariants({ variant }),
      )}
    >
      <Toast.Content className="flex gap-3 overflow-hidden transition-opacity duration-250 data-behind:pointer-events-none data-behind:opacity-0 data-[expanded]:pointer-events-auto data-[expanded]:opacity-100">
        {IconComponent && (
          <IconComponent
            className="mt-[0.1em] h-5 w-5 shrink-0"
            aria-hidden="true"
          />
        )}
        <div className="flex-1">
          <Toast.Title render={<Heading level="h4" />} />
          <Toast.Description render={<Paragraph />} />
        </div>
        <Toast.Close
          render={<CloseButton size="sm" />}
          className="absolute top-2 right-2"
          aria-label="Close"
          nativeButton
        />
      </Toast.Content>
    </Toast.Root>
  );
}

type TypedUseToastManager = Omit<UseToastManagerReturnValue, 'add'> & {
  add: (data: ToastData) => void;
  toast: (data: ToastData) => void;
};

export function useToast(): TypedUseToastManager {
  const toastManager = Toast.useToastManager();

  const toast = (data: ToastData) => {
    toastManager.add(data);
  };

  return {
    ...toastManager,
    toast,
  } as TypedUseToastManager;
}

export function Toaster() {
  const { toasts } = useToast();

  return (
    <Toast.Portal>
      <Toast.Viewport
        className={cx(
          'fixed top-auto right-[1rem] bottom-[1rem]',
          'phone:right-[2rem] phone:bottom-[2rem] phone:w-[300px] z-10 mx-auto flex w-[250px]',
        )}
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </Toast.Viewport>
    </Toast.Portal>
  );
}
