import { useCallback, useEffect, useState } from 'react';

const DEFAULT_MAX_SIZE = 600;

/**
 * Finds the largest circle diameter that fits `count` circles into a
 * `width × height` area (accounting for gaps between items) by trying
 * every column count 1..count and picking the arrangement that
 * maximises the cell size.
 */
function computeCircleSize(
  width: number,
  height: number,
  count: number,
  gap: number,
): number {
  if (count === 0 || width <= 0 || height <= 0) return 0;

  let best = 0;
  for (let cols = 1; cols <= count; cols++) {
    const rows = Math.ceil(count / cols);
    const cellW = (width - gap * (cols - 1)) / cols;
    const cellH = (height - gap * (rows - 1)) / rows;
    const size = Math.min(cellW, cellH);
    if (size > best) best = size;
  }

  // Subtract 1px to avoid exact-fit boundary issues with flex-wrap
  return Math.max(Math.floor(best) - 1, 0);
}

type UseCircleLayoutOptions = {
  count: number;
  maxSize?: number;
};

export function useCircleLayout({
  count,
  maxSize = DEFAULT_MAX_SIZE,
}: UseCircleLayoutOptions) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0, gap: 0 });
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  const containerRef = useCallback((el: HTMLDivElement | null) => {
    setContainer(el);
  }, []);

  useEffect(() => {
    if (!container) return;

    let rafId: number | null = null;

    const measure = () => {
      rafId = null;
      const rect = container.getBoundingClientRect();
      const computedGap = parseFloat(getComputedStyle(container).gap) || 0;
      setDimensions({
        width: rect.width,
        height: rect.height,
        gap: computedGap,
      });
    };

    const observer = new ResizeObserver(() => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(measure);
    });

    observer.observe(container);
    return () => {
      observer.disconnect();
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [container]);

  const { width, height, gap } = dimensions;
  const circleSize = Math.min(
    computeCircleSize(width, height, count, gap),
    maxSize,
  );

  return {
    containerRef,
    flexBasis: circleSize,
  };
}
