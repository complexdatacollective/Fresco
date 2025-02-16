import cx from 'classnames';
import { motion, useReducedMotion } from 'motion/react';
import PropTypes from 'prop-types';
import React, { useMemo } from 'react';
import { compose } from 'recompose';
import { getCSSVariableAsNumber } from '~/lib/ui/utils/CSSVariables';
import {
  DragSource,
  DropTarget,
  MonitorDropTarget,
} from '../behaviours/DragAndDrop';

const ListContext = React.createContext({ items: [], columns: 0 });

const NoopComponent = () => null;

const variants = {
  show: {
    translateY: ['-50%', '0%'],
    opacity: [0, 1],
  },
  hidden: {
    translateY: 0,
    opacity: 0,
  },
};

const reducedMotionVariants = {
  show: { opacity: 1 },
  hidden: { opacity: 0 },
};

const getItemRenderer = (ItemComponent, DragComponent) => {
  const Component = DragSource(ItemComponent);

  const ItemRenderer = ({ id, data, props, itemType, allowDragging }) => {
    const reducedMotion = useReducedMotion();

    const cellVariants = reducedMotion ? reducedMotionVariants : variants;

    const preview = DragComponent ? <DragComponent {...data} /> : null;

    return (
      <motion.div
        className="list__item"
        variants={cellVariants}
        key={id}
        style={{transitionDuration: '--animation-duration-standard', ease: '--animation-easing'}}
      >
        <Component
          {...props}
          allowDrag={allowDragging}
          meta={() => ({ data, id, itemType })}
          preview={preview}
        />
      </motion.div>
    );
  };

  return ItemRenderer;
};

/**
 * Renders an arbitrary list of items using itemComponent.
 *
 * Includes drag and drop functionality.
 *
 * @prop {Array} items Items in format [{ id, props: {}, data: {} }, ...]
 * @prop {React Component} emptyComponent React component to render when items is an empty array.
 * @prop {React Component} itemComponent React component, rendered with `{ props }` from item.
 * `{ data }`, `id`, and `itemType` is passed to the drag and drop state.
 * @prop {React node} placeholder React node. If provided will override rendering of
 * items/emptyComponent and will be rendered instead.
 * example usage: `<List placeholder={(<div>placeholder</div>)} />`
 * @prop {string} itemType itemType used by drag and drop functionality
 */
const List = ({
  className,
  items,
  itemComponent: ItemComponent = NoopComponent,
  dragComponent: DragComponent = null,
  emptyComponent: EmptyComponent = NoopComponent,
  placeholder,
  willAccept,
  isOver,
  itemType = 'LIST',
  allowDragging = true,
}) => {

  const containerVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: getCSSVariableAsNumber('--animation-duration-fast') / 2,
      },
    },
  };

  const classNames = cx(
    'list',
    className,
    { 'list--drag': willAccept },
    { 'list--hover': willAccept && isOver },
  );

  const ItemRenderer = useMemo(
    () => getItemRenderer(ItemComponent, DragComponent),
    [ItemComponent, DragComponent],
  );

  const context = {};

  // const showOverlay = !!OverlayComponent;
  // If placeholder is provider it supercedes everything
  const showPlaceholder = !!placeholder;
  // If items is provided but is empty show the empty component
  const showEmpty = !placeholder && items && items.length === 0;
  // Otherwise show the results!
  const showResults = !placeholder && items && items.length > 0;

  return (
    <ListContext.Provider value={context}>
      <motion.div
        className={classNames}
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {showPlaceholder && placeholder}
        {showEmpty && <EmptyComponent />}

        {showResults &&
          items.map((item) => (
            <ItemRenderer
              key={item.id}
              itemType={itemType}
              allowDragging={allowDragging}
              {...item}
            />
          ))}
      </motion.div>
    </ListContext.Provider>
  );
};

List.propTypes = {
  itemComponent: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
  emptyComponent: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
  placeholder: PropTypes.node,
  itemType: PropTypes.string,
  allowDragging: PropTypes.bool,
};

export default compose(
  DropTarget,
  MonitorDropTarget(['isOver', 'willAccept']),
)(List);
