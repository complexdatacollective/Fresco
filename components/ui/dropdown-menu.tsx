'use client';

import { Menu } from '@base-ui/react/menu';
import { Check, CheckIcon, ChevronRight } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import * as React from 'react';

import {
  dropdownItemVariants,
  proportionalLucideIconVariants,
} from '~/styles/shared/controlVariants';
import { cx } from '~/utils/cva';
import { BaseUISharedPopoverContainer } from './popover';

type DropdownMenuContextValue = {
  mounted: boolean;
  setMounted: (mounted: boolean) => void;
};

const DropdownMenuContext =
  React.createContext<DropdownMenuContextValue | null>(null);

function useDropdownMenuContext() {
  const context = React.useContext(DropdownMenuContext);
  if (!context) {
    throw new Error(
      'DropdownMenu components must be used within a DropdownMenu',
    );
  }
  return context;
}

function DropdownMenu({
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof Menu.Root>) {
  const [mounted, setMounted] = React.useState(false);

  return (
    <DropdownMenuContext.Provider value={{ mounted, setMounted }}>
      <Menu.Root
        {...props}
        open={props.open ?? mounted}
        onOpenChange={(open, event) => {
          setMounted(open);
          props.onOpenChange?.(open, event);
        }}
      >
        {children}
      </Menu.Root>
    </DropdownMenuContext.Provider>
  );
}

const DropdownMenuTrigger = Menu.Trigger;

const DropdownMenuGroup = Menu.Group;

const DropdownMenuSub = Menu.SubmenuRoot;

const DropdownMenuRadioGroup = Menu.RadioGroup;

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof Menu.SubmenuTrigger>,
  React.ComponentPropsWithoutRef<typeof Menu.SubmenuTrigger> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => (
  <Menu.SubmenuTrigger
    ref={ref}
    className={cx(dropdownItemVariants(), inset && 'pl-8', className)}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto size-4" />
  </Menu.SubmenuTrigger>
));
DropdownMenuSubTrigger.displayName = 'DropdownMenuSubTrigger';

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof Menu.Popup>,
  Omit<React.ComponentPropsWithoutRef<typeof Menu.Popup>, 'className'> & {
    className?: string;
    sideOffset?: number;
    keepMounted?: boolean;
  }
>(({ className, sideOffset = 8, keepMounted = true, ...props }, ref) => {
  const { mounted } = useDropdownMenuContext();

  return (
    <Menu.Portal keepMounted={keepMounted}>
      <AnimatePresence>
        {mounted && (
          <Menu.Positioner sideOffset={sideOffset}>
            <Menu.Popup
              ref={ref}
              render={<BaseUISharedPopoverContainer className={className} />}
              {...props}
            />
          </Menu.Positioner>
        )}
      </AnimatePresence>
    </Menu.Portal>
  );
});
DropdownMenuSubContent.displayName = 'DropdownMenuSubContent';

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof Menu.Popup>,
  Omit<React.ComponentPropsWithoutRef<typeof Menu.Popup>, 'className'> & {
    className?: string;
    sideOffset?: number;
    side?: 'top' | 'right' | 'bottom' | 'left';
    align?: 'start' | 'center' | 'end';
    keepMounted?: boolean;
  }
>(
  (
    {
      className,
      sideOffset = 4,
      side = 'bottom',
      align = 'center',
      keepMounted = true,
      ...props
    },
    ref,
  ) => {
    const { mounted } = useDropdownMenuContext();

    return (
      <Menu.Portal keepMounted={keepMounted}>
        <AnimatePresence>
          {mounted && (
            <Menu.Positioner sideOffset={sideOffset} side={side} align={align}>
              <Menu.Popup
                ref={ref}
                render={<BaseUISharedPopoverContainer className={className} />}
                {...props}
              />
            </Menu.Positioner>
          )}
        </AnimatePresence>
      </Menu.Portal>
    );
  },
);
DropdownMenuContent.displayName = 'DropdownMenuContent';

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof Menu.Item>,
  React.ComponentPropsWithoutRef<typeof Menu.Item> & {
    icon?: React.ReactNode;
  }
>(({ className, icon, children, ...props }, ref) => (
  <Menu.Item
    ref={ref}
    className={cx(
      dropdownItemVariants(),
      proportionalLucideIconVariants(),
      'flex items-center gap-2 px-4',
      className,
    )}
    {...props}
  >
    {icon}
    {children}
  </Menu.Item>
));
DropdownMenuItem.displayName = 'DropdownMenuItem';

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof Menu.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof Menu.CheckboxItem>
>(({ className, children, ...props }, ref) => (
  <Menu.CheckboxItem
    ref={ref}
    className={cx(dropdownItemVariants(), 'relative pr-2 pl-8', className)}
    {...props}
  >
    <span className="absolute left-2 flex size-3.5 items-center justify-center">
      <Menu.CheckboxItemIndicator>
        <Check />
      </Menu.CheckboxItemIndicator>
    </span>
    {children}
  </Menu.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName = 'DropdownMenuCheckboxItem';

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof Menu.RadioItem>,
  React.ComponentPropsWithoutRef<typeof Menu.RadioItem> & {
    inset?: boolean;
    icon?: React.ReactNode;
  }
>(({ className, children, icon = <CheckIcon />, ...props }, ref) => (
  <Menu.RadioItem
    ref={ref}
    className={cx(dropdownItemVariants(), 'flex items-center px-4', className)}
    {...props}
  >
    <Menu.RadioItemIndicator
      keepMounted
      className={cx(
        proportionalLucideIconVariants(),
        'flex items-center justify-center',
      )}
    >
      {icon}
    </Menu.RadioItemIndicator>
    {children}
  </Menu.RadioItem>
));
DropdownMenuRadioItem.displayName = 'DropdownMenuRadioItem';

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof Menu.GroupLabel>,
  React.ComponentPropsWithoutRef<typeof Menu.GroupLabel> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <Menu.GroupLabel
    ref={ref}
    className={cx(
      'px-2 py-1.5 text-sm font-semibold',
      inset && 'pl-8',
      className,
    )}
    {...props}
  />
));
DropdownMenuLabel.displayName = 'DropdownMenuLabel';

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof Menu.Separator>,
  React.ComponentPropsWithoutRef<typeof Menu.Separator>
>(({ className, ...props }, ref) => (
  <Menu.Separator
    ref={ref}
    className={cx('mx-auto my-1 h-px w-full rounded bg-current/20', className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cx('ml-auto text-xs tracking-widest opacity-60', className)}
      {...props}
    />
  );
};
DropdownMenuShortcut.displayName = 'DropdownMenuShortcut';

export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
};
