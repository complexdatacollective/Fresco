'use client';

import {
  forwardRef,
  useContext,
  useRef,
  useImperativeHandle,
  useLayoutEffect,
  useState,
  useEffect,
} from 'react';
import {
  MotionConfigContext,
  useIsPresent,
  animate,
  motion,
  type HTMLMotionProps,
} from 'motion/react';
import { useIsInitialRender } from './hooks/useIsInitialRender';
import { maskHeight } from './Mask';
import { getWidthInEm } from './utils/getWidthInEms';
import { targetWidths } from './utils/targetWidths';
import { DirectionContext } from './DirectionContext';

type NumberDigitProps = Omit<HTMLMotionProps<'span'>, 'children'> & {
  value: number;
  initialValue?: number;
  layoutDependency?: unknown;
};

export const NumberDigit = forwardRef<HTMLSpanElement, NumberDigitProps>(
  function NumberDigit(
    { value: _value, initialValue: _initialValue, layoutDependency, ...rest },
    _ref,
  ) {
    const initialValue = useRef(_initialValue ?? _value).current;
    const { transition } = useContext(MotionConfigContext);
    const direction = useContext(DirectionContext);
    const isInitialRender = useIsInitialRender();
    const scope = useRef<HTMLSpanElement>(null);
    const ref = useRef<HTMLSpanElement>(null);
    useImperativeHandle(_ref, () => ref.current!, []);
    const numberRefs = useRef<(HTMLSpanElement | null)[]>(
      Array.from({ length: 10 }, () => null),
    );
    const isPresent = useIsPresent();
    const value = isPresent ? _value : 0;

    useLayoutEffect(() => {
      if (!scope.current || !numberRefs.current[initialValue]) return;
      scope.current.style.width = getWidthInEm(
        numberRefs.current[initialValue],
      );
    }, [initialValue]);

    const prevValue = useRef(initialValue);
    useLayoutEffect(() => {
      if (!scope.current || value === prevValue.current) return;

      const box = scope.current.getBoundingClientRect();
      const refBox = ref.current?.getBoundingClientRect();

      // Calculate the digit difference with direction awareness
      let digitDiff = value - prevValue.current;

      // Handle rollover cases where digit change direction doesn't match overall direction
      // direction='up': digits should come from below (positive offset)
      // direction='down': digits should come from above (negative offset)
      if (direction === 'up' && digitDiff < 0) {
        // Incrementing but digit went down (e.g., 9→0 in 9→10)
        // Wrap around: -9 becomes +1
        digitDiff += 10;
      } else if (direction === 'down' && digitDiff > 0) {
        // Decrementing but digit went up (e.g., 0→9 in 10→9)
        // Wrap around: +9 becomes -1
        digitDiff -= 10;
      }
      // Note: For cases like -9→-10 (direction='down', digitDiff=-9),
      // the digit is already moving in the correct direction (negative), so no adjustment needed

      const initialY =
        box.height * digitDiff +
        (box.top - (refBox ? refBox.top || 0 : box.top));

      animate(scope.current, { y: [initialY, 0] }, transition);

      return () => {
        prevValue.current = value;
      };
    }, [value, direction, transition]);

    const [width, setWidth] = useState<string>();
    useEffect(() => {
      if (isInitialRender && initialValue === value) return;
      if (!numberRefs.current[value]) return;

      const w = getWidthInEm(numberRefs.current[value]);
      if (ref.current) targetWidths.set(ref.current, w);
      setWidth(w);
    }, [value, isInitialRender, initialValue]);

    const renderNumber = (i: number) => (
      <span
        key={i}
        style={{
          display: 'inline-block',
          padding: `calc(${maskHeight}/2) 0`,
        }}
        ref={(r) => {
          numberRefs.current[i] = r;
        }}
      >
        {i}
      </span>
    );

    const digitFillStyle: React.CSSProperties = {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      position: 'absolute',
      width: '100%',
    };

    return (
      <motion.span
        {...rest}
        ref={ref}
        layout="position"
        layoutDependency={layoutDependency as boolean | undefined}
        data-state={isPresent ? undefined : 'exiting'}
        style={{
          display: 'inline-flex',
          justifyContent: 'center',
          width,
        }}
      >
        <span
          ref={scope}
          style={{
            display: 'inline-flex',
            justifyContent: 'center',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
          }}
        >
          {value !== 0 && (
            <span style={{ ...digitFillStyle, bottom: '100%', left: 0 }}>
              {new Array(value).fill(null).map((_, i) => renderNumber(i))}
            </span>
          )}
          {renderNumber(value)}
          {value !== 9 && (
            <span style={{ ...digitFillStyle, top: '100%', left: 0 }}>
              {new Array(9 - value)
                .fill(null)
                .map((_, i) => renderNumber(value + i + 1))}
            </span>
          )}
        </span>
      </motion.span>
    );
  },
);
