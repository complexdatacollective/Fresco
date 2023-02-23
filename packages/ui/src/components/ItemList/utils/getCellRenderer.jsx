import React, { useContext, useMemo, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import cx from 'classnames';
import { getDataIndex, getDelay } from '.';
import ListContext from '../ListContext';
import { useId } from 'react';
import { v4 } from 'uuid';

/**
 * @function getCellRenderer
 * Function called for each item when rendering the grid
 * @param {*} Component - A component for use when rendering
 * @returns function
 */
const getCellRenderer = (Component) => (args) => {
  const {
    columnIndex,
    isScrolling,
    rowIndex,
    style,
  } = args;

  const {
    items,
    columns,
    rowHeight,
    containerHeight,
    reducedMotion,
  } = useContext(ListContext);
  const dataIndex = getDataIndex(columns, { rowIndex, columnIndex });

  const item = items[dataIndex];

  if (!item) { return null; }

  const { id, attributes } = item;

  const delay = useMemo(
    () => getDelay(
      isScrolling, rowHeight, containerHeight, columns, columnIndex, rowIndex,
    ), [isScrolling, rowHeight, containerHeight, columns, columnIndex, rowIndex],
  );

  // console.log({
  //   delay,
  //   isScrolling,
  //   rowHeight,
  //   containerHeight,
  //   columns,
  //   columnIndex,
  //   rowIndex,
  // });

  const animation = useAnimation();
  const shouldAnimate = !reducedMotion && !isScrolling && delay > 0;

  // Here is where we define and manage our initial mounting animation for this cell
  useEffect(() => {
    if (shouldAnimate) {
      animation.start({
        opacity: 1,
        y: 0,
        transition: {
          delay,
        },
      });
    }
    return () => animation.stop();
  }, []);

  const classes = cx(
    'item-list__item',
  );

  // console.log('rendering', id);

  return (
    <motion.div
      initial={shouldAnimate && {
        opacity: 0,
        y: '75%',
      }}
      animate={animation}
      className={classes}
      style={style}
      key={id}
      exit={{ scale: 0, opacity: 0, transition: { duration: 0.2 } }}
    >
      <Component
        id={`item-${id}`}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...attributes}
      />
    </motion.div>
  );
};

export default getCellRenderer;
