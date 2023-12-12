// Since accepts() is a weak link and can throw errors if not carefully written.
const defaultSource = {
  meta: {},
};

export const willAccept = (accepts, source) => {
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

export const markOutOfBounds = (source) => {
  const isOutOfBounds =
    source.x > window.innerWidth ||
    source.x < 0 ||
    source.y > window.innerHeight ||
    source.y < 0;

  return isOutOfBounds;
};

export const markHitTarget = ({ target, source }) => {
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

export const markHitTargets = ({ targets, source }) =>
  targets.map((target) => markHitTarget({ target, source }));

export const markHitSource = ({ targets, source }) =>
  thru(source, (s) => {
    if (isEmpty(s)) {
      return s;
    }

    return {
      ...s,
      isOver: filter(targets, 'isOver').length > 0,
      isOutOfBounds: markOutOfBounds(s),
    };
  });

export const markHitAll = ({ targets, obstacles, source, ...rest }) => {
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

export const resetHits = ({ targets, ...rest }) => ({
  targets: targets.map((target) => omit(target, ['isOver', 'willAccept'])),
  ...rest,
});
