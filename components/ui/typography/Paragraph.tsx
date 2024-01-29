'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '~/utils/shadcn';

const paragraphVariants = cva('text-foreground leading-7', {
  variants: {
    variant: {
      default: '[&:not(:first-child)]:mt-6',
      blockquote: 'mt-6 border-l-2 pl-6 italic',
      inlineCode:
        'relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold',
      lead: 'mb-3 text-lg text-opacity-70 font-semibold md:text-xl',
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

const Paragraph = ({ className, variant, ...props }: ParagraphProps) => {
  return (
    <p className={cn(paragraphVariants({ variant, className }))} {...props} />
  );
};

export default Paragraph;
