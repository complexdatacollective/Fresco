import cx from 'classnames';
import { AnimatePresence, motion } from 'motion/react';
// @ts-expect-error - Next.js internal import
import { renderToString } from 'next/dist/compiled/react-dom/cjs/react-dom-server-legacy.browser.production';
import React, { memo, useCallback, useContext, useMemo } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
// @ts-expect-error - Missing types for react-window
import { VariableSizeList as List } from 'react-window';
import { useDragSource, useDropTarget } from '~/lib/dnd';

type HyperListItem = {
  id: string;
  props: Record<string, any>;
  data: Record<string, any>;
};

type DynamicProperties = {
  disabled?: string[];
  [key: string]: any;
};

type DraggableItemComponentProps = {
  ItemComponent: React.ComponentType<any>;
  item: HyperListItem;
  itemType: string;
  allowDrag: boolean;
  disabled: boolean;
  preview: React.ReactNode;
  [key: string]: any;
};

type ListContextType = {
  items: HyperListItem[];
  dynamicProperties: DynamicProperties;
  itemType: string;
};

type GetRowRenderContentProps = {
  index: number;
  style: React.CSSProperties;
};

type HyperListProps = {
  className?: string;
  items?: HyperListItem[];
  dynamicProperties?: DynamicProperties;
  itemComponent: React.ComponentType<any>;
  dragComponent?: React.ComponentType<any>;
  emptyComponent?: React.ComponentType<any>;
  placeholder?: React.ReactNode;
  itemType?: string;
  showTooMany?: boolean;
  allowDragging?: boolean;
  id?: string;
  accepts?: string[];
  onDrop?: (data: { meta: any }) => void;
};

// Draggable wrapper for item components
const DraggableItemComponent = memo<DraggableItemComponentProps>(({ 
  ItemComponent, 
  item, 
  itemType, 
  allowDrag, 
  disabled, 
  preview, 
  ...props 
}) => {
  const { dragProps } = useDragSource({
    type: 'node',
    metadata: { data: item.data, id: item.id, itemType },
    announcedName: `Item ${item.id}`,
    disabled: !allowDrag || disabled,
    preview,
  });

  return (
    <div {...dragProps}>
      <ItemComponent {...props} />
    </div>
  );
});

DraggableItemComponent.displayName = 'DraggableItemComponent';

const LargeRosterNotice = () => (
  <div
    className="large-roster-notice__wrapper"
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      height: '100%',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <motion.div
      className="large-roster-notice"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <h2>Too many items to display.</h2>
      <p>Use the search feature to see results here.</p>
    </motion.div>
  </div>
);

const GUTTER_SIZE = 14;

const ListContext = React.createContext<ListContextType>({ 
  items: [], 
  dynamicProperties: {}, 
  itemType: 'HYPER_LIST' 
});

const getRowRenderer = (
  Component: React.ComponentType<any>, 
  DragComponent?: React.ComponentType<any>, 
  allowDragging?: boolean
) => {
  const GetRowRenderContent: React.FC<GetRowRenderContentProps> = ({ index, style }) => {
    const { items, itemType, dynamicProperties } = useContext(ListContext);

    const item = items[index];

    if (!item) {
      return null;
    }

    const { disabled } = dynamicProperties;

    const isDisabled = Boolean(disabled?.includes(item.id));
    const preview = DragComponent ? <DragComponent {...item} /> : null;

    return (
      <div
        className="hyper-list__item"
        style={{
          ...style,
          left: (style.left as number) + GUTTER_SIZE,
          top: (style.top as number) + GUTTER_SIZE,
          width: `calc(${style.width} - ${GUTTER_SIZE * 2}px)`,
          height: (style.height as number) - GUTTER_SIZE,
        }}
        key={item.id}
      >
        <DraggableItemComponent
          ItemComponent={Component}
          item={item}
          itemType={itemType}
          allowDrag={(allowDragging ?? false) && !isDisabled}
          disabled={isDisabled}
          preview={preview}
          {...item.props}
        />
      </div>
    );
  };

  return GetRowRenderContent;
};

/**
 * Renders an arbitrary list of items using itemComponent.
 *
 * Includes drag and drop functionality.
 */
const HyperList: React.FC<HyperListProps> = ({
  className,
  items,
  dynamicProperties = {},
  itemComponent: ItemComponent,
  dragComponent: DragComponent,
  emptyComponent: EmptyComponent,
  placeholder = null,
  itemType = 'HYPER_LIST',
  showTooMany,
  allowDragging,
  id,
  accepts: _accepts,
  onDrop,
}) => {
  // Add drop target functionality
  const { dropProps } = useDropTarget({
    id: id || `hyper-list-${itemType}`,
    accepts: ['node'],
    announcedName: 'List',
    onDrop: (metadata) => {
      if (onDrop) {
        onDrop({ meta: metadata });
      }
    },
  });

  const RowRenderer = useMemo(
    () =>
      getRowRenderer(ItemComponent, DragComponent, allowDragging),
    [ItemComponent, DragComponent, allowDragging],
  );

  const context = useMemo(
    () => ({
      items: items ?? [],
      dynamicProperties,
      itemType,
    }),
    [items, dynamicProperties, itemType],
  );

  const classNames = cx('hyper-list', className);

  const SizeRenderer = useCallback(
    (props: any) => (
      <div className="hyper-list__item">
        <ItemComponent {...props} />
      </div>
    ),
    [ItemComponent],
  );

  const getItemSize = (item: number, listWidth: number): number => {
    if (!listWidth) {
      return 0;
    }

    const itemData = items?.[item];
    if (!itemData) return 0;
    const { props } = itemData;
    const newHiddenSizingEl = document.createElement('div');

    newHiddenSizingEl.style.position = 'absolute';
    newHiddenSizingEl.style.top = '0';
    newHiddenSizingEl.style.width = `${listWidth - GUTTER_SIZE * 2 - 14}px`; // Additional 14 for scrollbar
    newHiddenSizingEl.style.pointerEvents = 'none';

    newHiddenSizingEl.style.visibility = 'hidden';

    document.body.appendChild(newHiddenSizingEl);
    newHiddenSizingEl.innerHTML = renderToString(<SizeRenderer {...props} />);
    const height = newHiddenSizingEl.clientHeight;
    document.body.removeChild(newHiddenSizingEl);

    return height + GUTTER_SIZE;
  };

  // If placeholder is provider it supersedes everything
  const showPlaceholder = !!placeholder;
  // If items is provided but is empty show the empty component
  const showEmpty = !placeholder && items && items.length === 0;
  // Otherwise show the results!
  const showResults = !placeholder && items && items.length > 0;

  return (
    <>
      <motion.div
        {...dropProps}
        key={`hyper-list-${itemType}`}
        className={classNames}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <ListContext.Provider value={context}>
          <div className="hyper-list__container">
            <div className="hyper-list__sizer">
              <AnimatePresence mode="wait">
                {showPlaceholder ? (
                  placeholder
                ) : showEmpty && EmptyComponent ? (
                  <EmptyComponent />
                ) : (
                  <AutoSizer>
                    {(containerSize) => {
                      if (!showResults) {
                        return null;
                      }
                      return (
                        <List
                          key={containerSize.width}
                          className="hyper-list__grid"
                          height={containerSize.height}
                          width={containerSize.width}
                          itemSize={(item: number) =>
                            getItemSize(item, containerSize.width)
                          }
                          estimatedItemSize={getItemSize(0, containerSize.width)}
                          itemCount={items?.length ?? 0}
                        >
                          {RowRenderer}
                        </List>
                      );
                    }}
                  </AutoSizer>
                )}
              </AnimatePresence>
            </div>
          </div>
        </ListContext.Provider>
      </motion.div>
      <AnimatePresence>{showTooMany && <LargeRosterNotice />}</AnimatePresence>
    </>
  );
};

export default HyperList;
export type { HyperListProps, HyperListItem };