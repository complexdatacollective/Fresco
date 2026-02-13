import { type RefObject, useEffect, useRef } from 'react';
import getAbsoluteBoundingRect from '../../utils/getAbsoluteBoundingRect';
import { actionCreators as actions } from './reducer';
import store from './store';

const MAX_FRAMES_PER_SECOND = 10;

type UseDropObstacleOptions = {
  ref: RefObject<HTMLDivElement | null>;
  id: string;
};

export default function useDropObstacle({ ref, id }: UseDropObstacleOptions) {
  const intervalRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const animationFrameRef = useRef<number>(undefined);

  useEffect(() => {
    const node = ref.current?.firstElementChild;
    if (!node) {
      return;
    }

    const updateObstacle = () => {
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
        actions.upsertObstacle({
          id,
          width: boundingClientRect.width,
          height: boundingClientRect.height,
          y: boundingClientRect.top,
          x: boundingClientRect.left,
        }),
      );
    };

    const update = () => {
      updateObstacle();
      intervalRef.current = setTimeout(() => {
        animationFrameRef.current = requestAnimationFrame(update);
      }, 1000 / MAX_FRAMES_PER_SECOND);
    };

    update();

    return () => {
      store.dispatch(actions.removeObstacle(id));
      clearTimeout(intervalRef.current);
      cancelAnimationFrame(animationFrameRef.current!);
    };
  }, [ref, id]);
}
