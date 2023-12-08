import { createSlice } from '@reduxjs/toolkit';
import { isEmpty, thru } from 'lodash';
// import { markHitAll, markHitSource, markHitTarget } from './utils';

type Target = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  accepts?: string[];
  isOver?: boolean;
  willAccept?: boolean;
};

type Obstacle = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isOver?: boolean;
};

type Source = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  setValidMove: (valid: boolean) => void;
} | null;

type State = {
  targets: Target[];
  obstacles: Obstacle[];
  source: Source;
};

const initialState: State = {
  targets: [],
  obstacles: [],
  source: null,
};

// Since accepts() is a weak link and can throw errors if not carefully written.
const defaultSource = {
  meta: {},
};

export const willAccept = (
  accepts: (source: Source) => boolean,
  source: Source,
) => {
  try {
    return accepts({
      ...defaultSource,
      ...source,
    });
  } catch (e) {
    console.warn('Error in accept() function', e, source); // eslint-disable-line no-console
    return false;
  }
};

export const markOutOfBounds = (source: Source) => {
  const isOutOfBounds =
    source.x > window.innerWidth ||
    source.x < 0 ||
    source.y > window.innerHeight ||
    source.y < 0;

  return isOutOfBounds;
};

export const markHitTarget = ({
  target,
  source,
}: {
  target: Target;
  source: Source;
}) => {
  if (!source) {
    return { ...target, isOver: false, willAccept: false };
  }

  const isOver =
    source.x >= target.x &&
    source.x <= target.x + target.width &&
    source.y >= target.y &&
    source.y <= target.y + target.height;

  return {
    ...target,
    isOver,
    willAccept: target.accepts ? willAccept(target.accepts, source) : false,
  };
};

export const markHitTargets = ({
  targets,
  source,
}: {
  targets: Target[];
  source: Source;
}) => targets.map((target) => markHitTarget({ target, source }));

export const markHitSource = ({
  targets,
  source,
}: {
  targets: Target[];
  source: Source;
}) =>
  thru(source, (s) => {
    if (isEmpty(s)) {
      return s;
    }

    return {
      ...s,
      isOver: targets.filter((t) => t.isOver).length > 0,
      isOutOfBounds: markOutOfBounds(s),
    };
  });

export const markHitAll = ({
  targets,
  obstacles,
  source,
  ...rest
}: {
  targets: Target[];
  obstacles: Obstacle[];
  source: Source;
}) => {
  const targetsWithHits = markHitTargets({ targets, source });
  const obstaclesWithHits = markHitTargets({ targets: obstacles, source });
  const sourceWithHits = markHitSource({ targets: targetsWithHits, source });

  return {
    ...rest,
    targets: targetsWithHits,
    obstacles: obstaclesWithHits,
    source: sourceWithHits,
  };
};

export const resetHits = ({ targets, ...rest }: { targets: Target[] }) => ({
  targets: targets.map((target) => {
    const { isOver, willAccept, ...rest } = target;
    return rest;
  }),
  ...rest,
});

const triggerDrag = (state: State, source: Source) => {
  const hits = markHitAll({
    ...state,
    source: {
      ...state.source,
      ...source,
    },
  });

  source.setValidMove(true);

  

  if (hits.obstacles.some((obstacle) => obstacle.isOver) || hits.source.isOutOfBounds) {
    source.setValidMove(false);
    return;
  }

  hits.targets.filter((target) => target.isOver && target.willAccept).forEach((target) => {
    source.setValidMove(true);
    console.log('target', target);
    target.onDrag(hits.source);
  });
};

const triggerDrop = (state: State, source: Source) => {
  const hits = markHitAll({
    ...state,
    source: {
      ...state.source,
      ...source,
    },
  });


  hits.targets.filter((target) => target.willAccept).forEach((target) => {
    target.onDragEnd(hits.source);
  });

  if (hits.obstacles.some((obstacle) => obstacle.isOver)) {
    return;
  }

  hits.targets.filter((target) => target.isOver && target.willAccept).forEach((target) => {
    target.onDrop(hits.source);
  });
};

const dragAndDropSlice = createSlice({
  name: 'dragAndDrop',
  initialState,
  reducers: {
    upsertTarget(state, { payload: { target } }) {
      const targets: Target[] = [
        ...state.targets.filter((t) => t.id !== target.id),
        markHitTarget({ target, source: state.source }),
      ];

      const source = markHitSource({
        targets,
        source: state.source,
      });

      return {
        ...state,
        targets,
        source,
      };
    },
    renameTarget(state, action) {
      return {
        ...state,
        targets: state.targets.map((target) => {
          if (action.from !== target.id) {
            return target;
          }

          return {
            ...target,
            id: action.to,
          };
        }),
      };
    },
    removeTarget(state, action) {
      const targets = state.targets.filter((t) => t.id !== action.id);
      const source = markHitSource({ targets, source: state.source });
      return {
        ...state,
        targets,
        source,
      };
    },
    upsertObstacle(state, action) {
      const obstacles = [
        ...state.obstacles.filter((o) => o.id !== action.obstacle.id)
        markHitTarget({ target: action.obstacle, source: state.source }),
      ];

      const source = markHitSource({
        targets: obstacles,
        source: state.source,
      });

      return {
        ...state,
        obstacles,
        source,
      };
    },
    removeObstacle(state, action) {
      const obstacles = state.obstacles.filter((o) => o.id !== action.id);
      const source = markHitSource({
        targets: obstacles,
        source: state.source,
      });

      return {
        ...state,
        obstacles,
        source,
      };
    },
    dragStart(state, action) {
      return markHitAll({
        ...state,
        source: action.source,
      });
    },
    dragMove(state, action) {
      if (state.source === null) {
        return state;
      }

      return markHitAll({
        ...state,
        source: {
          ...state.source,
          ...action.source,
        },
      });
    },
    dragEnd(state, action) {
      return resetHits({
        ...state,
        source: null,
      });
    },
  },
});

export const {
  upsertTarget,
  renameTarget,
  removeTarget,
  upsertObstacle,
  removeObstacle,
  dragStart,
  dragMove,
  dragEnd,
} = dragAndDropSlice.actions;

export default dragAndDropSlice.reducer;
