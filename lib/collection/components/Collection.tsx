import { useRef } from 'react';
import { useMergeRefs } from 'react-best-merge-refs';
import { ScrollArea } from '~/components/ui/ScrollArea';
import { cx } from '~/utils/cva';
import { CollectionProvider } from '../CollectionProvider';
import {
  CollectionIdContext,
  SelectionManagerContext,
  SortManagerContext,
} from '../contexts';
import { useCollectionSetup } from '../hooks/useCollectionSetup';
import { useSortState } from '../hooks/useSortState';
import { type CollectionProps, type ItemRenderer } from '../types';
import { StaticRenderer } from './StaticRenderer';
import { VirtualizedRenderer } from './VirtualizedRenderer';

type CollectionContentProps<T> = Omit<
  CollectionProps<T>,
  'items' | 'keyExtractor' | 'textValueExtractor'
>;

/**
 * Internal component that renders the collection items.
 * Separated to use hooks within the provider context.
 */
function CollectionContent<T>({
  layout,
  renderItem,
  emptyState,
  className,
  id,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  selectionMode,
  selectedKeys,
  defaultSelectedKeys,
  onSelectionChange,
  disabledKeys,
  disallowEmptySelection,
  animate,
  dragAndDropHooks,
  virtualized,
  overscan,
  // Sort props
  sortBy,
  sortDirection,
  sortType,
  defaultSortBy,
  defaultSortDirection,
  defaultSortType,
  onSortChange,
  sortRules,
  // Children for sort UI
  children,
}: CollectionContentProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const collectionId = id ?? crypto.randomUUID();

  // Use shared setup hook for selection, keyboard, DnD
  const {
    collection,
    selectionManager,
    collectionProps,
    dndCollectionProps,
    dropState,
  } = useCollectionSetup<T>(
    {
      selectionMode,
      selectedKeys,
      defaultSelectedKeys,
      onSelectionChange,
      disabledKeys,
      disallowEmptySelection,
      dragAndDropHooks,
      layout,
      collectionId,
    },
    containerRef,
  );

  // Use sort state hook for sorting
  const sortManager = useSortState({
    sortBy,
    sortDirection,
    sortType,
    defaultSortBy,
    defaultSortDirection,
    defaultSortType,
    onSortChange,
    sortRules,
  });

  // Extract ref and tabIndex from dndCollectionProps
  // - ref: merged with containerRef
  // - tabIndex: excluded - Collection's collectionProps.tabIndex (0) takes precedence
  //   over drop target's tabIndex (-1 when not dragging)
  const {
    ref: dndRef,
    tabIndex,
    ...restDndProps
  } = dndCollectionProps as {
    ref?: (el: HTMLElement | null) => void;
    tabIndex?: number;
  };
  // tabIndex is intentionally unused - Collection's tabIndex takes precedence
  void tabIndex;
  const mergedRef = useMergeRefs({ containerRef, dndRef });

  return (
    <SelectionManagerContext.Provider value={selectionManager}>
      <SortManagerContext.Provider value={sortManager}>
        <CollectionIdContext.Provider value={collectionId}>
          {children}
          <ScrollArea
            className={cx('min-h-40', className)}
            ref={mergedRef}
            id={collectionId}
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
            aria-multiselectable={selectionMode === 'multiple' || undefined}
            aria-activedescendant={
              selectionManager.focusedKey !== null
                ? `${collectionId}-item-${selectionManager.focusedKey}`
                : undefined
            }
            data-drop-target-over={dropState?.isOver}
            data-drop-target-valid={dropState?.willAccept}
            data-dragging={dropState?.isDragging}
            {...collectionProps}
            {...restDndProps}
          >
            {virtualized ? (
              <VirtualizedRenderer
                layout={layout}
                collection={collection}
                renderItem={renderItem}
                animate={animate}
                collectionId={collectionId}
                dragAndDropHooks={dragAndDropHooks}
                scrollRef={containerRef}
                overscan={overscan}
              />
            ) : (
              <StaticRenderer
                layout={layout}
                collection={collection}
                renderItem={renderItem}
                animate={animate}
                collectionId={collectionId}
                dragAndDropHooks={dragAndDropHooks}
              />
            )}
            {collection.size === 0 && (
              <div className="text-center text-current/70">{emptyState}</div>
            )}
          </ScrollArea>
        </CollectionIdContext.Provider>
      </SortManagerContext.Provider>
    </SelectionManagerContext.Provider>
  );
}

/**
 * Collection component that renders a list of items with support for:
 * - Selection (single/multiple)
 * - Keyboard navigation
 * - Drag and drop
 *
 * The layout prop controls positioning:
 * - ListLayout: Vertical list using CSS flexbox
 * - GridLayout: CSS grid layout
 *
 * @example List layout
 * ```tsx
 * <Collection
 *   items={users}
 *   keyExtractor={(user) => user.id}
 *   layout={new ListLayout({ gap: 8 })}
 *   renderItem={(user) => (
 *     <div className="p-2">{user.name}</div>
 *   )}
 * />
 * ```
 *
 * @example Grid layout
 * ```tsx
 * <Collection
 *   items={products}
 *   keyExtractor={(p) => p.id}
 *   layout={new GridLayout({ minItemWidth: 200 })}
 *   renderItem={(product) => <ProductCard product={product} />}
 * />
 * ```
 */
export function Collection<T>({
  items,
  keyExtractor,
  textValueExtractor,
  layout,
  renderItem,
  emptyState = <>No items to display.</>,
  className,
  id,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  selectionMode,
  selectedKeys,
  defaultSelectedKeys,
  onSelectionChange,
  disabledKeys,
  disallowEmptySelection,
  animate = true,
  dragAndDropHooks,
  virtualized,
  overscan,
  // Sort props
  sortBy,
  sortDirection,
  sortType,
  defaultSortBy,
  defaultSortDirection,
  defaultSortType,
  onSortChange,
  sortRules,
  // Children for sort UI
  children,
}: CollectionProps<T>) {
  return (
    <CollectionProvider
      items={items}
      keyExtractor={keyExtractor}
      textValueExtractor={textValueExtractor}
    >
      <CollectionContent
        layout={layout}
        renderItem={renderItem as ItemRenderer<unknown>}
        emptyState={emptyState}
        className={className}
        id={id}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        selectionMode={selectionMode}
        selectedKeys={selectedKeys}
        defaultSelectedKeys={defaultSelectedKeys}
        onSelectionChange={onSelectionChange}
        disabledKeys={disabledKeys}
        disallowEmptySelection={disallowEmptySelection}
        animate={animate}
        dragAndDropHooks={dragAndDropHooks}
        virtualized={virtualized}
        overscan={overscan}
        // Sort props
        sortBy={sortBy}
        sortDirection={sortDirection}
        sortType={sortType}
        defaultSortBy={defaultSortBy}
        defaultSortDirection={defaultSortDirection}
        defaultSortType={defaultSortType}
        onSortChange={onSortChange}
        sortRules={sortRules}
      >
        {children}
      </CollectionContent>
    </CollectionProvider>
  );
}
