import { clamp } from 'es-toolkit';
import { type RefObject, useCallback, useRef } from 'react';
import { type SociogramStoreApi } from './useSociogramStore';

const DRAG_THRESHOLD = 5;
const NUDGE_AMOUNT = 0.02;

type UseCanvasDragOptions = {
  nodeId: string;
  canvasRef: RefObject<HTMLElement | null>;
  store: SociogramStoreApi;
  onDragEnd?: (nodeId: string, position: { x: number; y: number }) => void;
  onClick?: () => void;
  disabled?: boolean;
  simulation?: {
    moveNode: (nodeId: string, position: { x: number; y: number }) => void;
    releaseNode: (nodeId: string) => void;
  } | null;
};

export function useCanvasDrag({
  nodeId,
  canvasRef,
  store,
  onDragEnd,
  onClick,
  disabled = false,
  simulation = null,
}: UseCanvasDragOptions) {
  const isDraggingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  const screenToNormalized = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0.5, y: 0.5 };
      const rect = canvas.getBoundingClientRect();
      return {
        x: clamp((clientX - rect.left) / rect.width, 0, 1),
        y: clamp((clientY - rect.top) / rect.height, 0, 1),
      };
    },
    [canvasRef],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return;
      if (e.button !== 0) return;

      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);

      isDraggingRef.current = false;
      startPosRef.current = { x: e.clientX, y: e.clientY };

      const pointerId = e.pointerId;

      const handleMove = (moveEvent: PointerEvent) => {
        const dx = moveEvent.clientX - startPosRef.current.x;
        const dy = moveEvent.clientY - startPosRef.current.y;

        if (
          !isDraggingRef.current &&
          Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD
        ) {
          return;
        }

        isDraggingRef.current = true;

        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
        }

        rafRef.current = requestAnimationFrame(() => {
          const pos = screenToNormalized(moveEvent.clientX, moveEvent.clientY);
          store.getState().setPosition(nodeId, pos);
          simulation?.moveNode(nodeId, pos);
          rafRef.current = null;
        });
      };

      const handleUp = (_upEvent: PointerEvent) => {
        document.removeEventListener('pointermove', handleMove);
        document.removeEventListener('pointerup', handleUp);
        document.removeEventListener('pointercancel', handleUp);

        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }

        try {
          (e.target as HTMLElement).releasePointerCapture(pointerId);
        } catch {
          // Pointer capture may already be released
        }

        if (isDraggingRef.current) {
          const pos = store.getState().positions.get(nodeId);
          if (pos) {
            simulation?.releaseNode(nodeId);
            onDragEnd?.(nodeId, pos);
          }
        } else {
          onClick?.();
        }

        isDraggingRef.current = false;
      };

      document.addEventListener('pointermove', handleMove);
      document.addEventListener('pointerup', handleUp);
      document.addEventListener('pointercancel', handleUp);
    },
    [
      disabled,
      nodeId,
      screenToNormalized,
      store,
      simulation,
      onDragEnd,
      onClick,
    ],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;

      const pos = store.getState().positions.get(nodeId);
      if (!pos) return;

      let newPos: { x: number; y: number } | null = null;

      switch (e.key) {
        case 'ArrowUp':
          newPos = { x: pos.x, y: clamp(pos.y - NUDGE_AMOUNT, 0, 1) };
          break;
        case 'ArrowDown':
          newPos = { x: pos.x, y: clamp(pos.y + NUDGE_AMOUNT, 0, 1) };
          break;
        case 'ArrowLeft':
          newPos = { x: clamp(pos.x - NUDGE_AMOUNT, 0, 1), y: pos.y };
          break;
        case 'ArrowRight':
          newPos = { x: clamp(pos.x + NUDGE_AMOUNT, 0, 1), y: pos.y };
          break;
        default:
          return;
      }

      e.preventDefault();
      store.getState().setPosition(nodeId, newPos);
      simulation?.moveNode(nodeId, newPos);
      onDragEnd?.(nodeId, newPos);
    },
    [disabled, nodeId, store, simulation, onDragEnd],
  );

  return {
    dragProps: {
      onPointerDown,
      onKeyDown,
      style: {
        cursor: disabled ? 'default' : 'grab',
        touchAction: 'none' as const,
      },
    },
    isDragging: isDraggingRef.current,
  };
}
