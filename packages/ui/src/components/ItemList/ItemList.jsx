import {
  useMemo,
  useRef,
  useEffect,
  useState,
  useCallback,
} from 'react';
import PropTypes from 'prop-types';
import { debounce, isEmpty } from '@codaco/utils';
import AutoSizer from 'react-virtualized-auto-sizer';
import {
  AnimatePresence,
  useReducedMotion,
} from 'framer-motion';
import { VariableSizeGrid as Grid } from 'react-window';
import cx from 'classnames';
import { useDroppable } from '@dnd-kit/core';
import useGridSizer from './hooks/useGridSizer';
import useSize from '../../hooks/useSize';
import getCellRenderer from './utils/getCellRenderer';
import ListContext from './ListContext';
import DefaultEmptyComponent from './DefaultEmptyComponent';
import DefaultDropOverlay from './DefaultDropOverlay';
import './ItemList.scss';

const ItemList = ({
  className,
  items,
  useItemSizing,
  itemComponent: ItemComponent,
  emptyComponent: EmptyComponent,
  cardColumnBreakpoints,
}) => {
  const containerRef = useRef(null);

  // For some reason, these values cannot be 0 to start, otherwise the grid will not render!
  const [width, setWidth] = useState(1);
  const [height, setHeight] = useState(1);
  const {
    setNodeRef,
    isOver,
    active,
  } = useDroppable({
    id: 'ItemList', // Use react ID?
    data: {
      accepts: ['draggable'],
    },
  });

  console.log({
    isOver,
    active,
  });

  const debouncedSizeUpdate = useCallback(debounce(({ width: newWidth, height: newHeight }) => {
    if (height !== newHeight) {
      setHeight(newHeight);
    }
    if (width !== newWidth) {
      setWidth(newWidth);
    }
  }, 100), [width, height]);

  const size = useSize(containerRef);

  useEffect(() => {
    if (size) {
      debouncedSizeUpdate(size);
    }
  }, [size]);

  // Instantiate useGridSizer: enhancement to react-window allowing dynamic heights
  const [{
    key,
    columnCount,
    rowCount,
    columnWidth,
    rowHeight,
  }, ready] = useGridSizer(
    useItemSizing,
    cardColumnBreakpoints,
    ItemComponent,
    items,
    width, // container width from resizeAware
  );

  const CellRenderer = useMemo(
    () => getCellRenderer(ItemComponent),
    [ItemComponent, items, useItemSizing],
  );

  const reducedMotion = useReducedMotion();

  const context = useMemo(() => ({
    items,
    columns: columnCount,
    rowHeight,
    containerHeight: height,
    reducedMotion,
  }), [
    items,
    columnCount,
    rowHeight,
    height,
    reducedMotion,
  ]);

  return (
    <div
      className={cx(
        'item-list',
        { 'item-list--empty': isEmpty(items) },
        className,
      )}
      ref={(el) => { setNodeRef(el); containerRef.current = el; }}
    >
      <AnimatePresence>
        {active && <DefaultDropOverlay isOver={isOver} />}
      </AnimatePresence>
      <AnimatePresence mode='wait'>
        <div className="item-list__container" key={key}>
          <ListContext.Provider value={context}>
            {isEmpty(items) ? (<EmptyComponent />) : (
              <AutoSizer key={key}>
                {({ width: containerWidth, height: containerHeight }) => {
                  // If auto sizer is not ready, items would be sized incorrectly
                  if (!ready) { return null; }
                  return (
                    <Grid
                      className="item-list__grid"
                      height={containerHeight}
                      width={containerWidth}
                      columnCount={columnCount}
                      rowCount={rowCount}
                      columnWidth={columnWidth}
                      rowHeight={rowHeight}
                      useIsScrolling
                    >
                      {CellRenderer}
                    </Grid>
                  );
                }}
              </AutoSizer>
            )}
          </ListContext.Provider>
        </div>
      </AnimatePresence>
    </div>
  );
};

ItemList.propTypes = {
  useItemSizing: PropTypes.bool,
  className: PropTypes.string,
  itemComponent: PropTypes.oneOfType([PropTypes.object, PropTypes.func]).isRequired,
  emptyComponent: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
  cardColumnBreakpoints: PropTypes.object,
  items: PropTypes.array.isRequired,
};

ItemList.defaultProps = {
  useItemSizing: false,
  className: null,
  emptyComponent: DefaultEmptyComponent,
  cardColumnBreakpoints: {
    250: 1,
    500: 2,
    750: 3,
  },
};

export default ItemList;
