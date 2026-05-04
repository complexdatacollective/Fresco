import { cva } from '@codaco/fresco-ui/utils/cva';

// Used by ActionButton, QuickAddField, and NodeForm.

export const actionCircleVariants = cva({
  base: 'elevation-high flex items-center justify-center overflow-hidden rounded-full',
});

// Set on <Icon> directly, not via a parent selector — the SVG may sit inside
// wrapper divs (e.g. AnimatePresence motion.div) where direct-child selectors fail.
export const actionIconClass = 'aspect-square size-16';

export const actionPlusBadgeVariants = cva({
  base: 'bg-platinum text-charcoal absolute -top-2 -right-4 flex size-10 items-center justify-center rounded-full shadow-lg',
});

export const actionPlusIconClass = 'size-6';
