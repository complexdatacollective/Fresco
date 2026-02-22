import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_MAX_SIZE = 500;
const DEFAULT_GAP = 24;

function computeCircleSize(
  width: number,
  height: number,
  count: number,
  gap: number,
  maxSize: number,
): number {
  if (count === 0 || width <= 0 || height <= 0) return 0;

  let best = 0;

  for (let cols = 1; cols <= count; cols++) {
    const rows = Math.ceil(count / cols);
    const availW = (width - gap * (cols - 1)) / cols;
    const availH = (height - gap * (rows - 1)) / rows;
    const size = Math.min(availW, availH);
    if (size > best) best = size;
  }

  return Math.min(Math.floor(best), maxSize);
}

type UseCircleLayoutOptions = {
  count: number;
  maxSize?: number;
  gap?: number;
};

export function useCircleLayout({
  count,
  maxSize = DEFAULT_MAX_SIZE,
  gap = DEFAULT_GAP,
}: UseCircleLayoutOptions) {
  const [circleSize, setCircleSize] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<ResizeObserver | null>(null);

  const recalculate = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    setCircleSize(computeCircleSize(width, height, count, gap, maxSize));
  }, [count, gap, maxSize]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    observerRef.current = new ResizeObserver(() => {
      recalculate();
    });
    observerRef.current.observe(el);

    recalculate();

    return () => {
      observerRef.current?.disconnect();
    };
  }, [recalculate]);

  return { containerRef, circleSize };
}
