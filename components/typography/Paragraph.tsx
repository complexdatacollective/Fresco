'use client';

import { forwardRef } from 'react';
import { cva, cx, type VariantProps } from '~/utils/cva';

export const paragraphVariants = cva({
  base: 'text-pretty text-base',
  variants: {
    intent: {
      default: '',
      blockquote: 'mt-6 border-l-2 pl-6 italic',
      inlineCode:
        'relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold',
      lead: 'mb-6 text-lg',
      smallText: 'text-sm',
    },
    emphasis: {
      default: '',
      muted: 'text-current/60',
    },
    margin: {
      default: 'not-first:mt-4',
      none: 'mt-0',
    },
  },
  defaultVariants: {
    intent: 'default',
    margin: 'default',
  },
});

type ParagraphProps = {
  intent?: VariantProps<typeof paragraphVariants>['intent'];
  emphasis?: VariantProps<typeof paragraphVariants>['emphasis'];
  margin?: VariantProps<typeof paragraphVariants>['margin'];
  asChild?: boolean;
} & React.HTMLAttributes<HTMLParagraphElement>;

const Paragraph = forwardRef<HTMLParagraphElement, ParagraphProps>(
  ({ className, intent, margin, emphasis, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cx(
          paragraphVariants({ intent, margin, emphasis, className }),
        )}
        {...props}
      />
    );
  },
);

Paragraph.displayName = 'Paragraph';

export default Paragraph;
