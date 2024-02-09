'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef } from 'react';
import { cn } from '~/utils/shadcn';

const paragraphVariants = cva('text-foreground text-pretty font-medium', {
  variants: {
    variant: {
      default: '[&:not(:first-child)]:mt-6',
      blockquote: 'mt-6 border-l-2 pl-6 italic',
      inlineCode:
        'relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold',
      lead: 'mb-3 text-lg text-opacity-70 font-semibold md:text-xl leading-6',
      mutedText: 'text-muted',
      smallText: 'text-sm',
      noMargin: 'mt-0',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export type ParagraphProps = {
  variant?: VariantProps<typeof paragraphVariants>['variant'];
  asChild?: boolean;
} & React.HTMLAttributes<HTMLParagraphElement>;

const Paragraph = forwardRef<HTMLParagraphElement, ParagraphProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn(paragraphVariants({ variant, className }))}
        {...props}
      />
    );
  },
);

Paragraph.displayName = 'Paragraph';

export default Paragraph;
