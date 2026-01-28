import cx from 'classnames';
import { AnimatePresence, motion } from 'motion/react';
// @ts-expect-error - Next.js internal import
import { renderToString } from 'next/dist/compiled/react-dom/cjs/react-dom-server-legacy.browser.production';
import React, { memo, useCallback, useContext, useMemo } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
// @ts-expect-error - Missing types for react-window
import { VariableSizeList as List } from 'react-window';
import { useDragSource, useDropTarget } from '~/lib/dnd';

type HyperListItem<
  TProps = Record<string, unknown>,
  TData = Record<string, unknown>,
> = {
  id: string;
  props: TProps;
  data: TData;
};

type DynamicProperties = {
  disabled?: string[];
  [key: string]: unknown;
};

type DraggableItemComponentProps<
  TProps = Record<string, unknown>,
  TData = Record<string, unknown>,
> = {
  ItemComponent: React.ComponentType<TProps>;
  item: HyperListItem<TProps, TData>;
  itemType: string;
  allowDrag: boolean;
  disabled: boolean;
  preview: React.ReactNode;
} & TProps;

type ListContextType<
  TProps = Record<string, unknown>,
  TData = Record<string, unknown>,
> = {
  items: HyperListItem<TProps, TData>[];
  dynamicProperties: DynamicProperties;
  itemType: string;
};

type GetRowRenderContentProps = {
  index: number;
  style: React.CSSProperties;
};

type HyperListProps<
  TProps = Record<string, unknown>,
  TData = Record<string, unknown>,
> = {
  className?: string;
  items?: HyperListItem<TProps, TData>[];
  dynamicProperties?: DynamicProperties;
  itemComponent: React.ComponentType<TProps>;
  dragComponent?: React.ComponentType<HyperListItem<TProps, TData>>;
  emptyComponent?: React.ComponentType;
  placeholder?: React.ReactNode;
  itemType?: string;
  showTooMany?: boolean;
  allowDragging?: boolean;
  id?: string;
  accepts?: string[];
  onDrop?: (data: { meta: TData }) => void;
};

// Draggable wrapper for item components
const DraggableItemComponent = memo(
  ({
    ItemComponent,
    item,
    itemType,
    allowDrag,
    disabled,
    preview,
    ...props
  }: DraggableItemComponentProps) => {
    const { dragProps } = useDragSource({
      type: itemType,
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
  },
);

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
  itemType: 'HYPER_LIST',
});

const getRowRenderer = <
  TProps extends Record<string, unknown>,
  TData extends Record<string, unknown>,
>(
  Component: React.ComponentType<TProps>,
  DragComponent?: React.ComponentType<HyperListItem<TProps, TData>>,
  allowDragging?: boolean,
) => {
  const GetRowRenderContent: React.FC<GetRowRenderContentProps> = ({
    index,
    style,
  }) => {
    const { items, itemType, dynamicProperties } = useContext(
      ListContext,
    ) as ListContextType<TProps, TData>;

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
          ItemComponent={
            Component as React.ComponentType<Record<string, unknown>>
          }
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
const HyperList = <
  TProps extends Record<string, unknown>,
  TData extends Record<string, unknown>,
>({
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
  accepts,
  onDrop,
}: HyperListProps<TProps, TData>) => {
  // Add drop target functionality
  const { dropProps } = useDropTarget({
    id: id ?? `hyper-list-${itemType}`,
    accepts: accepts ?? [],
    announcedName: 'List',
    onDrop: (metadata) => {
      if (onDrop) {
        onDrop({ meta: metadata as TData });
      }
    },
  });

  const RowRenderer = useMemo(
    () => getRowRenderer(ItemComponent, DragComponent, allowDragging),
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
    (props: TProps) => (
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    newHiddenSizingEl.innerHTML = renderToString(<SizeRenderer {...props} />);
    const height = newHiddenSizingEl.clientHeight;
    document.body.removeChild(newHiddenSizingEl);

    return height + GUTTER_SIZE;
  };

  // If placeholder is provider it supersedes everything
  const showPlaceholder = !!placeholder;
  // If items is provided but is empty show the empty component
  const showEmpty = !placeholder && items?.length === 0;
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
                          estimatedItemSize={getItemSize(
                            0,
                            containerSize.width,
                          )}
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
