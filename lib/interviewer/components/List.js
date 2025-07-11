import cx from 'classnames';
import { motion, useReducedMotion } from 'motion/react';
import PropTypes from 'prop-types';
import React, { useMemo } from 'react';
import { getCSSVariableAsNumber } from '~/lib/ui/utils/CSSVariables';
import { DragSource } from '../behaviours/DragAndDrop/DragSource';
import { DropTarget } from '../behaviours/DragAndDrop/DropTarget';
import { MonitorDropTarget } from '../behaviours/DragAndDrop/MonitorDropTarget';

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
        <DragSource
          allowDrag={allowDragging}
          meta={() => ({ data, id, itemType })}
          preview={preview}
        >
          {(nodeRef, _dragState) => (
            <ItemComponent
              ref={nodeRef}
              {...props}
            />
          )}
        </DragSource>
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
  itemType = 'LIST',
  allowDragging = true,
  // Drop target props
  id = 'list',
  accepts,
  onDrop,
  onDrag,
  onDragEnd,
  meta,
}) => {
  const containerVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: getCSSVariableAsNumber('--animation-duration-fast') / 2,
      },
    },
  };

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
    <DropTarget
      id={id}
      accepts={accepts}
      onDrop={onDrop}
      onDrag={onDrag}
      onDragEnd={onDragEnd}
      meta={meta}
    >
      {(elementRef, _dropState) => (
        <MonitorDropTarget targetId={id}>
          {(monitorState) => {
            const classNames = cx(
              'list',
              className,
              { 'list--drag': monitorState.willAccept },
              { 'list--hover': monitorState.willAccept && monitorState.isOver },
            );

            return (
              <ListContext.Provider value={context}>
                <motion.div
                  ref={elementRef}
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
          }}
        </MonitorDropTarget>
      )}
    </DropTarget>
  );
};

List.propTypes = {
  itemComponent: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
  emptyComponent: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
  placeholder: PropTypes.node,
  itemType: PropTypes.string,
  allowDragging: PropTypes.bool,
  // Drop target props
  id: PropTypes.string,
  accepts: PropTypes.func,
  onDrop: PropTypes.func,
  onDrag: PropTypes.func,
  onDragEnd: PropTypes.func,
  meta: PropTypes.func,
};

export default List;
