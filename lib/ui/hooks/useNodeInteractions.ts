import { useAnimate } from 'motion/react';
import { useCallback, useState, type CSSProperties } from 'react';

export type UseNodeInteractionsOptions = {
  /** Whether the node has a click handler (enables press animation) */
  hasClickHandler?: boolean;
  /** Whether the node is disabled */
  disabled?: boolean;
};

export type UseNodeInteractionsReturn = {
  /** Ref callback to attach to the node element (for motion scope) */
  scope: React.RefObject<HTMLElement | null>;
  /** Props to spread on the node element */
  nodeProps: {
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
    onPointerCancel: (e: React.PointerEvent) => void;
    onPointerLeave: (e: React.PointerEvent) => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
    onKeyUp: (e: React.KeyboardEvent) => void;
    style: CSSProperties;
  };
  /** Whether the node is currently being pressed */
  isPressed: boolean;
};

/**
 * Hook for managing Node interaction behaviors.
 *
 * Provides:
 * - Press animation (scale) when hasClickHandler is true
 * - Base styles (touch-action, user-select)
 *
 * Note: Cursor is NOT managed by this hook. The Node component determines
 * cursor based on external style props (for drag systems) or onClick presence.
 *
 * @example
 * ```tsx
 * const { scope, nodeProps, isPressed } = useNodeInteractions({
 *   hasClickHandler: !!onClick,
 *   disabled: false,
 * });
 *
 * return (
 *   <motion.button ref={scope} {...nodeProps}>
 *     Node
 *   </motion.button>
 * );
 * ```
 */
export function useNodeInteractions(
  options: UseNodeInteractionsOptions = {},
): UseNodeInteractionsReturn {
  const { hasClickHandler = false, disabled = false } = options;

  const [scope, animate] = useAnimate<HTMLElement>();
  const [isPressed, setIsPressed] = useState(false);

  // Enable press animation when there's a click handler and not disabled
  const enablePressAnimation = hasClickHandler && !disabled;

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return;
      if (e.button !== 0) return; // Only respond to primary button

      if (enablePressAnimation && scope.current) {
        setIsPressed(true);
        animate(scope.current, { scale: 0.92 });
      }
    },
    [disabled, enablePressAnimation, animate, scope],
  );

  const resetPress = useCallback(() => {
    if (!isPressed) return;
    setIsPressed(false);

    if (scope.current) {
      animate(
        scope.current,
        { scale: 1 },
        { type: 'spring', stiffness: 700, damping: 20 },
      );
    }
  }, [isPressed, animate, scope]);

  const handlePointerUp = useCallback(
    (_e: React.PointerEvent) => {
      resetPress();
    },
    [resetPress],
  );

  // Also reset on pointer cancel and leave to handle edge cases
  const handlePointerCancel = useCallback(
    (_e: React.PointerEvent) => {
      resetPress();
    },
    [resetPress],
  );

  const handlePointerLeave = useCallback(
    (_e: React.PointerEvent) => {
      resetPress();
    },
    [resetPress],
  );

  // Keyboard handlers for Enter and Space (keys that trigger button clicks)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;
      if (e.key !== 'Enter' && e.key !== ' ') return;
      if (e.repeat) return; // Prevent repeated animation from key repeat

      if (enablePressAnimation && scope.current) {
        setIsPressed(true);
        animate(scope.current, { scale: 0.92 });
      }
    },
    [disabled, enablePressAnimation, animate, scope],
  );

  const handleKeyUp = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      resetPress();
    },
    [resetPress],
  );

  return {
    scope,
    nodeProps: {
      onPointerDown: handlePointerDown,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel,
      onPointerLeave: handlePointerLeave,
      onKeyDown: handleKeyDown,
      onKeyUp: handleKeyUp,
      style: {
        touchAction: 'manipulation',
        userSelect: 'none',
      },
    },
    isPressed,
  };
}
