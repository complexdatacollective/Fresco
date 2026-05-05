import { cva } from '@codaco/fresco-ui/utils/cva';

// Used by ActionButton, QuickAddField, and NodeForm.

// The `[&_.lucide]` rules size Lucide icons to h-16. Custom icons (which lack
// the `.lucide` class) fall through to actionIconClass below and fill the
// container. Descendant (`[&_…]`) rather than direct-child (`[&>…]`) so
// wrapper divs (e.g. AnimatePresence motion.div) don't break the selector.
export const actionCircleVariants = cva({
  base: 'elevation-high flex items-center justify-center overflow-hidden rounded-full [&_.lucide]:aspect-square [&_.lucide]:h-16 [&_.lucide]:w-auto',
});

export const actionIconClass = 'h-full w-auto';

export const actionPlusBadgeVariants = cva({
  base: 'bg-platinum text-charcoal absolute -top-2 -right-4 flex size-10 items-center justify-center rounded-full shadow-lg',
});

export const actionPlusIconClass = 'size-6';
