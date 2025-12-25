'use client';

import {
  forwardRef,
  useRef,
  useImperativeHandle,
  useMemo,
  useState,
  useEffect,
  type CSSProperties,
} from 'react';
import { motion, AnimatePresence, type HTMLMotionProps } from 'motion/react';
import { useIsInitialRender } from './hooks/useIsInitialRender';
import { NumberDigit } from './NumberDigit';
import { NumberSymbol } from './NumberSymbol';
import { SectionContext } from './SectionContext';
import { getWidthInEm } from './utils/getWidthInEms';
import { targetWidths } from './utils/targetWidths';
import { type NumberPart } from './utils/formatParts';

type NumberSectionProps = Omit<HTMLMotionProps<'span'>, 'children'> & {
  parts: NumberPart[];
  justify?: 'left' | 'right';
  mode?: 'sync' | 'popLayout';
  name: string;
  layoutDependency?: unknown;
};

export const NumberSection = forwardRef<HTMLSpanElement, NumberSectionProps>(
  function NumberSection(
    { parts, justify = 'left', mode, style, name, layoutDependency, ...rest },
    _ref,
  ) {
    const ref = useRef<HTMLSpanElement>(null);
    useImperativeHandle(_ref, () => ref.current!, []);
    const context = useMemo(() => ({ justify }), [justify]);
    const measuredRef = useRef<HTMLSpanElement>(null);
    const isInitialRender = useIsInitialRender();

    const [width, setWidth] = useState<string>();

    useEffect(() => {
      if (!measuredRef.current) return;

      if (isInitialRender) {
        if (ref.current) {
          ref.current.style.width = getWidthInEm(measuredRef.current);
        }
        return;
      }

      const undos = Array.from(measuredRef.current.children).map((child) => {
        if (!(child instanceof HTMLElement)) return;

        if (child.dataset.state === 'exiting') {
          const next = child.nextSibling;
          child.remove();
          return () => {
            if (measuredRef.current) {
              measuredRef.current.insertBefore(child, next);
            }
          };
        }

        const newWidth = targetWidths.get(child);
        if (!newWidth) return;

        const oldWidth = child.style.width;
        child.style.width = newWidth;
        return () => {
          child.style.width = oldWidth;
        };
      });

      setWidth(getWidthInEm(measuredRef.current));

      for (let i = undos.length - 1; i >= 0; i--) {
        const undo = undos[i];
        if (undo) undo();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [parts.map((p) => p.value).join('')]);

    return (
      <SectionContext.Provider value={context}>
        <motion.span
          layoutDependency={layoutDependency as boolean | undefined}
          {...rest}
          ref={ref}
          data-section={name}
          style={
            {
              ...style,
              display: 'inline-flex',
              justifyContent: justify,
              width,
            } as CSSProperties
          }
        >
          <span
            ref={measuredRef}
            style={{
              display: 'inline-flex',
              justifyContent: 'inherit',
              position: 'relative',
            }}
          >
            {'\u200B'}
            <AnimatePresence mode={mode} initial={false}>
              {parts.map((part) =>
                part.type === 'integer' || part.type === 'fraction' ? (
                  <NumberDigit
                    key={part.key}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    value={part.value as number}
                    initialValue={isInitialRender ? undefined : 0}
                    layoutDependency={layoutDependency as boolean | undefined}
                  />
                ) : (
                  <NumberSymbol
                    key={
                      part.type === 'literal'
                        ? `${part.key}:${part.value}`
                        : part.key
                    }
                    type={part.type}
                    partKey={part.key!}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    layoutDependency={layoutDependency as boolean | undefined}
                  >
                    {part.value}
                  </NumberSymbol>
                ),
              )}
            </AnimatePresence>
          </span>
        </motion.span>
      </SectionContext.Provider>
    );
  },
);
