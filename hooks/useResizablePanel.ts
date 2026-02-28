'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { z } from 'zod';
import useSafeLocalStorage from '~/hooks/useSafeLocalStorage';

type Breakpoint = {
  value: number;
  label: string;
};

type UseResizablePanelOptions = {
  storageKey: string;
  defaultBasis: number;
  min: number;
  max: number;
  breakpoints?: Breakpoint[];
  orientation?: 'horizontal' | 'vertical';
  keyboardStep?: number;
};

const basisSchema = z.number().min(0).max(100);

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function nearestBreakpoint(value: number, breakpoints: Breakpoint[]) {
  let closest: Breakpoint | undefined;
  let closestDistance = Infinity;

  for (const bp of breakpoints) {
    const distance = Math.abs(value - bp.value);
    if (distance < closestDistance) {
      closestDistance = distance;
      closest = bp;
    }
  }

  return closest?.value ?? value;
}

export default function useResizablePanel({
  storageKey,
  defaultBasis,
  min,
  max,
  breakpoints = [],
  orientation = 'horizontal',
  keyboardStep = 2,
}: UseResizablePanelOptions) {
  const hasBreakpoints = breakpoints.length > 0;
  const sortedBreakpoints = useMemo(
    () =>
      hasBreakpoints ? [...breakpoints].sort((a, b) => a.value - b.value) : [],
    [hasBreakpoints, breakpoints],
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [persistedBasis, setPersistedBasis] = useSafeLocalStorage(
    `resizable-panel-${storageKey}`,
    basisSchema,
    defaultBasis,
  );

  const setBasis = useCallback(
    (value: number) => {
      const clamped = clamp(value, min, max);
      setPersistedBasis(clamped);
    },
    [min, max, setPersistedBasis],
  );

  const getPercentFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      const container = containerRef.current;
      if (!container) return persistedBasis;

      const rect = container.getBoundingClientRect();
      const isHorizontal = orientation === 'horizontal';
      const pos = isHorizontal ? clientX - rect.left : clientY - rect.top;
      const size = isHorizontal ? rect.width : rect.height;

      if (size === 0) return persistedBasis;
      return (pos / size) * 100;
    },
    [orientation, persistedBasis],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      setIsDragging(true);
    },
    [],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;

      const rawPercent = getPercentFromPointer(e.clientX, e.clientY);
      const value = hasBreakpoints
        ? nearestBreakpoint(rawPercent, breakpoints)
        : rawPercent;
      setBasis(value);
    },
    [isDragging, getPercentFromPointer, hasBreakpoints, breakpoints, setBasis],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.currentTarget.releasePointerCapture(e.pointerId);
      setIsDragging(false);
    },
    [],
  );

  const handleDoubleClick = useCallback(() => {
    setBasis(defaultBasis);
  }, [defaultBasis, setBasis]);

  const stepToAdjacentBreakpoint = useCallback(
    (direction: 'increase' | 'decrease') => {
      const prev = sortedBreakpoints
        .filter((bp) => bp.value < persistedBasis)
        .pop();
      const next = sortedBreakpoints.find((bp) => bp.value > persistedBasis);

      if (direction === 'increase') {
        setBasis(next ? next.value : (sortedBreakpoints.at(-1)?.value ?? max));
      } else {
        setBasis(prev ? prev.value : (sortedBreakpoints[0]?.value ?? min));
      }
    },
    [sortedBreakpoints, persistedBasis, setBasis, min, max],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const isHorizontal = orientation === 'horizontal';
      const increaseKey = isHorizontal ? 'ArrowRight' : 'ArrowDown';
      const decreaseKey = isHorizontal ? 'ArrowLeft' : 'ArrowUp';

      switch (e.key) {
        case increaseKey:
          e.preventDefault();
          if (hasBreakpoints) {
            stepToAdjacentBreakpoint('increase');
          } else {
            setBasis(persistedBasis + keyboardStep);
          }
          break;
        case decreaseKey:
          e.preventDefault();
          if (hasBreakpoints) {
            stepToAdjacentBreakpoint('decrease');
          } else {
            setBasis(persistedBasis - keyboardStep);
          }
          break;
        case 'Home':
          e.preventDefault();
          setBasis(hasBreakpoints ? (sortedBreakpoints[0]?.value ?? min) : min);
          break;
        case 'End':
          e.preventDefault();
          setBasis(
            hasBreakpoints ? (sortedBreakpoints.at(-1)?.value ?? max) : max,
          );
          break;
        case 'PageUp': {
          e.preventDefault();
          stepToAdjacentBreakpoint('decrease');
          break;
        }
        case 'PageDown': {
          e.preventDefault();
          stepToAdjacentBreakpoint('increase');
          break;
        }
      }
    },
    [
      orientation,
      persistedBasis,
      keyboardStep,
      hasBreakpoints,
      sortedBreakpoints,
      stepToAdjacentBreakpoint,
      min,
      max,
      setBasis,
    ],
  );

  return {
    basis: persistedBasis,
    isDragging,
    containerRef,
    handleProps: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onDoubleClick: handleDoubleClick,
      onKeyDown: handleKeyDown,
    },
  };
}
