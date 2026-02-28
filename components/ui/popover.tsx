import { Popover as BasePopover } from '@base-ui/react/popover';
import { AnimatePresence } from 'motion/react';
import {
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useState,
  type ComponentProps,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react';
import { cx } from '~/utils/cva';
import { MotionSurface } from '../layout/Surface';

type PopoverContextValue = {
  mounted: boolean;
  setMounted: (mounted: boolean) => void;
};

const PopoverContext = createContext<PopoverContextValue | null>(null);

function usePopoverContext() {
  const context = useContext(PopoverContext);
  if (!context) {
    throw new Error('Popover components must be used within a Popover');
  }
  return context;
}

type PopoverProps = ComponentProps<typeof BasePopover.Root> & {
  children: ReactNode;
};

function Popover({ children, ...props }: PopoverProps) {
  const [mounted, setMounted] = useState(false);

  const handleOpenChange = (
    nextOpen: boolean,
    event: BasePopover.Root.ChangeEventDetails,
  ) => {
    setMounted(nextOpen);
    props.onOpenChange?.(nextOpen, event);
  };

  return (
    <PopoverContext.Provider value={{ mounted, setMounted }}>
      <BasePopover.Root
        {...props}
        open={props.open ?? mounted}
        onOpenChange={handleOpenChange}
      >
        {children}
      </BasePopover.Root>
    </PopoverContext.Provider>
  );
}

type PopoverTriggerProps = ComponentProps<typeof BasePopover.Trigger> & {
  asChild?: boolean;
};

function isButtonElement(element: React.ReactElement): boolean {
  if (typeof element.type === 'string') {
    return element.type === 'button';
  }
  const name =
    (element.type as { displayName?: string }).displayName ??
    (element.type as { name?: string }).name ??
    '';
  return /button/i.test(name);
}

function PopoverTrigger({
  children,
  asChild,
  nativeButton,
  ...props
}: PopoverTriggerProps) {
  if (asChild && isValidElement<Record<string, unknown>>(children)) {
    return (
      <BasePopover.Trigger
        nativeButton={nativeButton ?? isButtonElement(children)}
        render={(triggerProps) =>
          cloneElement(children, {
            ...triggerProps,
            ...children.props,
          } as Parameters<typeof cloneElement>[1])
        }
        {...props}
      />
    );
  }

  return (
    <BasePopover.Trigger nativeButton={nativeButton} {...props}>
      {children}
    </BasePopover.Trigger>
  );
}

type PopoverContentProps = ComponentProps<typeof BasePopover.Popup> & {
  children: ReactNode;
  sideOffset?: number;
  showArrow?: boolean;
  keepMounted?: boolean;
  align?: 'start' | 'center' | 'end';
};

function PopoverContent({
  children,
  sideOffset = 10,
  showArrow = true,
  keepMounted = true,
  className,
  align = 'center',
  ...props
}: PopoverContentProps) {
  const { mounted } = usePopoverContext();

  return (
    <BasePopover.Portal
      keepMounted={keepMounted}
      {...(props as ComponentPropsWithoutRef<typeof BasePopover.Portal>)}
    >
      <AnimatePresence>
        {mounted && (
          <BasePopover.Positioner sideOffset={sideOffset} align={align}>
            <BasePopover.Popup
              render={
                <MotionSurface
                  level="popover"
                  elevation="none"
                  noContainer
                  className={cx(
                    'max-w-(--available-width) overflow-visible shadow-xl',
                    className,
                  )}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ type: 'spring', duration: 0.5 }}
                />
              }
              {...props}
            >
              {showArrow && (
                <BasePopover.Arrow className="data-[side=bottom]:top-[-15px] data-[side=left]:right-[-13px] data-[side=left]:rotate-90 data-[side=right]:left-[-13px] data-[side=right]:-rotate-90 data-[side=top]:bottom-[-14px] data-[side=top]:rotate-180">
                  <ArrowSvg />
                </BasePopover.Arrow>
              )}
              {children}
            </BasePopover.Popup>
          </BasePopover.Positioner>
        )}
      </AnimatePresence>
    </BasePopover.Portal>
  );
}

function ArrowSvg(props: ComponentProps<'svg'>) {
  return (
    <svg width="30" height="20" viewBox="0 0 20 10" fill="none" {...props}>
      <path
        d="M9.66437 2.60207L4.80758 6.97318C4.07308 7.63423 3.11989 8 2.13172 8H0V10H20V8H18.5349C17.5468 8 16.5936 7.63423 15.8591 6.97318L11.0023 2.60207C10.622 2.2598 10.0447 2.25979 9.66437 2.60207Z"
        className="fill-surface-popover"
      />
    </svg>
  );
}

export { Popover, PopoverContent, PopoverTrigger };
