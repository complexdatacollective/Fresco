import { useCallback, useRef } from 'react';

// Does not fire the onClick if the target moves over 5px (or whatever is passed in)
export function useClickUnlessDragged(threshold = 5) {
  const startRef = useRef<[number, number] | null>(null);
  const draggedRef = useRef(false);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    startRef.current = [e.clientX, e.clientY];
    draggedRef.current = false;
  }, []);

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!startRef.current) return;
      const [startX, startY] = startRef.current;
      const moved = Math.hypot(e.clientX - startX, e.clientY - startY);
      draggedRef.current = moved > threshold;
      startRef.current = null;
    },
    [threshold],
  );

  const shouldHandleClick = useCallback(() => !draggedRef.current, []);

  return { handlePointerDown, handlePointerUp, shouldHandleClick };
}
