import { type RefObject, useEffect, useRef } from 'react';
import getAbsoluteBoundingRect from '../../utils/getAbsoluteBoundingRect';
import { actionCreators as actions } from './reducer';
import store from './store';

const MAX_FRAMES_PER_SECOND = 10;

type UseDropTargetOptions = {
  ref: RefObject<HTMLDivElement | null>;
  id: string;
  onDrop?: (source: unknown) => void;
  onDrag?: (source: unknown) => void;
  onDragEnd?: (source: unknown) => void;
  accepts?: (source: unknown) => boolean;
  meta?: () => Record<string, unknown>;
};

export default function useDropTarget({
  ref,
  id,
  onDrop = () => ({}),
  onDrag = () => ({}),
  onDragEnd = () => ({}),
  accepts = () => false,
  meta = () => ({}),
}: UseDropTargetOptions) {
  const intervalRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const animationFrameRef = useRef<number>(undefined);

  // Store callback refs so the polling loop always sees latest values
  const callbacksRef = useRef({ onDrop, onDrag, onDragEnd, accepts, meta });
  callbacksRef.current = { onDrop, onDrag, onDragEnd, accepts, meta };

  useEffect(() => {
    const node = ref.current?.firstElementChild;
    if (!node) {
      return;
    }

    const updateTarget = () => {
      const el = ref.current?.firstElementChild;
      if (!el) {
        return;
      }

      const boundingClientRect = getAbsoluteBoundingRect(el as HTMLElement) as {
        width: number;
        height: number;
        top: number;
        left: number;
      };
      if (!boundingClientRect) return;

      store.dispatch(
        actions.upsertTarget({
          id,
          onDrop: callbacksRef.current.onDrop,
          onDrag: callbacksRef.current.onDrag,
          onDragEnd: callbacksRef.current.onDragEnd,
          accepts: callbacksRef.current.accepts,
          meta: callbacksRef.current.meta(),
          width: boundingClientRect.width,
          height: boundingClientRect.height,
          y: boundingClientRect.top,
          x: boundingClientRect.left,
        }),
      );
    };

    const update = () => {
      updateTarget();
      intervalRef.current = setTimeout(() => {
        animationFrameRef.current = requestAnimationFrame(update);
      }, 1000 / MAX_FRAMES_PER_SECOND);
    };

    update();

    return () => {
      store.dispatch(actions.removeTarget(id));
      clearTimeout(intervalRef.current);
      cancelAnimationFrame(animationFrameRef.current!);
    };
  }, [ref, id]);
}
