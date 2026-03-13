'use client';

import { motion, useMotionValue, useTransform } from 'motion/react';
import { memo, type ReactNode } from 'react';
import { RenderMarkdown } from '~/components/RenderMarkdown';
import {
  controlLabelVariants,
  controlVariants,
  groupSpacingVariants,
  inputControlVariants,
  smallSizeVariants,
  stateVariants,
} from '~/styles/shared/controlVariants';
import { compose, cva, cx } from '~/utils/cva';

const buttonVariants = compose(
  controlVariants,
  inputControlVariants,
  groupSpacingVariants,
  stateVariants,
  cva({
    base: cx('elevation-low flex min-w-0 justify-start gap-3', 'focusable'),
    variants: {
      selected: {
        true: '',
        false: 'hover:border-accent/30',
      },
      negative: {
        true: 'outline-destructive!',
        false: 'outline-success!',
      },
    },
    compoundVariants: [
      {
        selected: true,
        negative: false,
        class: 'border-success',
      },
      {
        selected: true,
        negative: true,
        class: 'border-destructive',
      },
    ],
    defaultVariants: {
      selected: false,
      negative: false,
    },
  }),
);

const indicatorVariants = compose(
  smallSizeVariants,
  controlVariants,
  inputControlVariants,
  cva({
    base: cx(
      'flex aspect-square shrink-0 items-center justify-center rounded-full',
      'transition-colors duration-200',
    ),
    variants: {
      selected: {
        true: '',
        false: 'border-input-contrast/20 bg-input',
      },
      negative: {
        true: '',
        false: '',
      },
    },
    compoundVariants: [
      {
        selected: true,
        negative: false,
        class: 'bg-success border-success text-success-contrast',
      },
      {
        selected: true,
        negative: true,
        class: 'bg-destructive border-destructive text-destructive-contrast',
      },
    ],
    defaultVariants: {
      selected: false,
      negative: false,
    },
  }),
);

function Indicator({
  selected,
  negative,
}: {
  selected: boolean;
  negative: boolean;
}) {
  const pathLength = useMotionValue(selected ? 1 : 0);
  const strokeLinecap = useTransform(() =>
    pathLength.get() === 0 ? 'butt' : 'round',
  );

  return (
    <div className={indicatorVariants({ selected, negative })}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="size-full p-[0.15em]"
        stroke="currentColor"
        strokeWidth="3"
      >
        {!negative ? (
          <motion.path
            d="M4 12L10 18L20 6"
            initial={false}
            animate={{ pathLength: selected ? 1 : 0 }}
            transition={{
              type: 'spring',
              bounce: 0,
              duration: selected ? 0.3 : 0.1,
            }}
            style={{
              pathLength,
              strokeLinecap,
            }}
          />
        ) : (
          <>
            <motion.path
              d="M6 6L18 18"
              initial={false}
              animate={{ pathLength: selected ? 1 : 0 }}
              transition={{
                type: 'spring',
                bounce: 0,
                duration: selected ? 0.3 : 0.1,
                delay: selected ? 0 : 0.05,
              }}
              style={{
                pathLength,
                strokeLinecap,
              }}
            />
            <motion.path
              d="M18 6L6 18"
              initial={false}
              animate={{ pathLength: selected ? 1 : 0 }}
              transition={{
                type: 'spring',
                bounce: 0,
                duration: selected ? 0.3 : 0.1,
                delay: selected ? 0.1 : 0,
              }}
              style={{
                pathLength,
                strokeLinecap,
              }}
            />
          </>
        )}
      </svg>
    </div>
  );
}

type BooleanOptionProps = {
  className?: string;
  selected?: boolean;
  label: string | (() => ReactNode);
  onClick?: () => void;
  negative?: boolean;
};

const BooleanOption = memo(function BooleanOption({
  className,
  selected = false,
  label,
  onClick,
  negative = false,
}: BooleanOptionProps) {
  return (
    <button
      type="button"
      className={buttonVariants({
        selected,
        negative,
        className: cx('gap-2 text-left', className),
      })}
      onClick={onClick}
    >
      <Indicator selected={selected} negative={negative} />
      <div className={controlLabelVariants({ size: 'md' })}>
        {typeof label === 'function' ? (
          label()
        ) : (
          <RenderMarkdown>{label}</RenderMarkdown>
        )}
      </div>
    </button>
  );
});

export default BooleanOption;
