'use client';

import { forwardRef, useContext, type ReactNode } from 'react';
import {
  useIsPresent,
  motion,
  AnimatePresence,
  type HTMLMotionProps,
} from 'motion/react';
import { maskHeight } from './Mask';
import { SectionContext } from './SectionContext';

type NumberSymbolProps = Omit<HTMLMotionProps<'span'>, 'children'> & {
  partKey: string;
  type: string;
  children: ReactNode;
  layoutDependency?: unknown;
};

export const NumberSymbol = forwardRef<HTMLSpanElement, NumberSymbolProps>(
  function NumberSymbol({ children, layoutDependency, ...rest }, ref) {
    const isPresent = useIsPresent();
    const { justify } = useContext(SectionContext);

    return (
      <motion.span
        {...rest}
        data-state={isPresent ? undefined : 'exiting'}
        style={{
          display: 'inline-flex',
          justifyContent: justify,
          padding: `calc(${maskHeight}/2) 0`,
          position: 'relative',
        }}
        layout="position"
        layoutDependency={layoutDependency as boolean | undefined}
        ref={ref}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            layout={justify === 'right' ? 'position' : false}
            layoutDependency={layoutDependency as boolean | undefined}
            initial={{ opacity: 0 }}
            animate={{ opacity: [null, 1] }}
            exit={{ opacity: [null, 0] }}
            style={{
              display: 'inline-block',
              whiteSpace: 'pre',
            }}
            key={children as string}
          >
            {children}
          </motion.span>
        </AnimatePresence>
      </motion.span>
    );
  },
);
