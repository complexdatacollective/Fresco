'use client';

import { forwardRef } from 'react';
import { cva, cx, type VariantProps } from '~/utils/cva';

export const paragraphVariants = cva({
  base: 'text-pretty font-normal text-base',
  variants: {
    intent: {
      default: '',
      blockquote: 'mt-4 border-l-2 pl-6 italic',
      inlineCode:
        'relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono font-semibold',
      lead: 'text-lg',
      smallText: 'text-sm',
    },
    emphasis: {
      default: 'opacity-100',
      muted: 'text-current/60',
    },
    margin: {
      default: 'not-last:mb-4',
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
  margin?: VariantProps<typeof paragraphVariants>['margin'];
  emphasis?: VariantProps<typeof paragraphVariants>['emphasis'];
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
