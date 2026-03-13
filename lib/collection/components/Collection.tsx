import { useEffect, useRef } from 'react';
import { useMergeRefs } from 'react-best-merge-refs';
import { ScrollArea } from '~/components/ui/ScrollArea';
import { cx } from '~/utils/cva';
import { CollectionProvider } from '../CollectionProvider';
import {
  CollectionIdContext,
  FilterManagerContext,
  SelectionManagerContext,
  SortManagerContext,
  useCollectionStore,
} from '../contexts';
import { useCollectionSetup } from '../hooks/useCollectionSetup';
import { useFilterState } from '../hooks/useFilterState';
import { useSortState } from '../hooks/useSortState';
import { type SortState } from '../sorting/types';
import {
  type CollectionProps,
  type ItemRenderer,
  type KeyExtractor,
} from '../types';
import { StaticRenderer } from './StaticRenderer';
import { VirtualizedRenderer } from './VirtualizedRenderer';

type CollectionContentProps<T> = Omit<
  CollectionProps<T>,
  'items' | 'textValueExtractor'
> & {
  items: T[];
};

/**
 * Internal component that renders the collection items.
 * Separated to use hooks within the provider context.
 */
function CollectionContent<T extends Record<string, unknown>>({
  items,
  keyExtractor,
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
  animationKey,
  dragAndDropHooks,
  virtualized,
  overscan,
  viewportClassName,
  orientation,
  layoutGroupId,
  // Sort props
  sortBy,
  sortDirection,
  sortType,
  defaultSortBy,
  defaultSortDirection,
  defaultSortType,
  onSortChange,
  sortRules,
  // Filter props
  filterQuery,
  defaultFilterQuery,
  onFilterChange,
  onFilterResultsChange,
  filterKeys,
  filterFuseOptions,
  filterDebounceMs,
  filterMinQueryLength,
  // Children for sort/filter UI
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

  // Use filter state hook for filtering (only if filterKeys is provided)
  const filterManager = useFilterState({
    filterQuery,
    defaultFilterQuery,
    onFilterChange,
    onFilterResultsChange,
    filterKeys,
    filterFuseOptions,
    filterDebounceMs,
    filterMinQueryLength,
    items,
    keyExtractor: keyExtractor as KeyExtractor<Record<string, unknown>>,
  });

  // Reset scroll position when filter results or sort state changes
  const filterDebouncedQuery = useCollectionStore<unknown, string>(
    (state) => state.filterDebouncedQuery,
  );
  const storeSortProperty = useCollectionStore<
    unknown,
    SortState['sortProperty']
  >((state) => state.sortProperty);
  const storeSortDirection = useCollectionStore<
    unknown,
    SortState['sortDirection']
  >((state) => state.sortDirection);
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [filterDebouncedQuery, storeSortProperty, storeSortDirection]);

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
        <FilterManagerContext.Provider value={filterManager}>
          <CollectionIdContext.Provider value={collectionId}>
            {children}
            <div
              className={cx('min-h-0 w-full flex-1', className)}
              data-drop-target-over={dropState?.isOver ?? undefined}
              data-drop-target-valid={dropState?.willAccept ?? undefined}
              data-dragging={dropState?.isDragging ?? undefined}
            >
              <ScrollArea
                ref={mergedRef}
                role="listbox"
                id={collectionId}
                viewportClassName={viewportClassName}
                orientation={orientation}
                aria-label={ariaLabel}
                aria-labelledby={ariaLabelledBy}
                aria-multiselectable={selectionMode === 'multiple' || undefined}
                aria-activedescendant={
                  selectionManager.focusedKey !== null
                    ? `${collectionId}-item-${selectionManager.focusedKey}`
                    : undefined
                }
                {...collectionProps}
                {...restDndProps}
                className="size-full"
              >
                {virtualized ? (
                  <VirtualizedRenderer
                    layout={layout}
                    collection={collection}
                    renderItem={renderItem}
                    animate={animate}
                    animationKey={animationKey}
                    collectionId={collectionId}
                    dragAndDropHooks={dragAndDropHooks}
                    scrollRef={containerRef}
                    overscan={overscan}
                    layoutGroupId={layoutGroupId}
                  />
                ) : (
                  <StaticRenderer
                    layout={layout}
                    collection={collection}
                    renderItem={renderItem}
                    animate={animate}
                    animationKey={animationKey}
                    collectionId={collectionId}
                    dragAndDropHooks={dragAndDropHooks}
                    layoutGroupId={layoutGroupId}
                  />
                )}
                {collection.size === 0 && emptyState && (
                  <div className="text-center text-current/70">
                    {emptyState}
                  </div>
                )}
              </ScrollArea>
            </div>
          </CollectionIdContext.Provider>
        </FilterManagerContext.Provider>
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
export function Collection<T extends Record<string, unknown>>({
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
  animationKey,
  dragAndDropHooks,
  virtualized,
  overscan,
  viewportClassName,
  orientation,
  layoutGroupId,
  // Sort props
  sortBy,
  sortDirection,
  sortType,
  defaultSortBy,
  defaultSortDirection,
  defaultSortType,
  onSortChange,
  sortRules,
  // Filter props
  filterQuery,
  defaultFilterQuery,
  onFilterChange,
  onFilterResultsChange,
  filterKeys,
  filterFuseOptions,
  filterDebounceMs,
  filterMinQueryLength,
  // Children for sort/filter UI
  children,
}: CollectionProps<T>) {
  return (
    <CollectionProvider
      items={items}
      keyExtractor={keyExtractor}
      textValueExtractor={textValueExtractor}
    >
      <CollectionContent
        items={items}
        keyExtractor={keyExtractor}
        layout={layout}
        renderItem={renderItem as ItemRenderer<Record<string, unknown>>}
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
        animationKey={animationKey}
        dragAndDropHooks={dragAndDropHooks}
        virtualized={virtualized}
        overscan={overscan}
        viewportClassName={viewportClassName}
        orientation={orientation}
        layoutGroupId={layoutGroupId}
        // Sort props
        sortBy={sortBy}
        sortDirection={sortDirection}
        sortType={sortType}
        defaultSortBy={defaultSortBy}
        defaultSortDirection={defaultSortDirection}
        defaultSortType={defaultSortType}
        onSortChange={onSortChange}
        sortRules={sortRules}
        // Filter props
        filterQuery={filterQuery}
        defaultFilterQuery={defaultFilterQuery}
        onFilterChange={onFilterChange}
        onFilterResultsChange={onFilterResultsChange}
        filterKeys={filterKeys}
        filterFuseOptions={filterFuseOptions}
        filterDebounceMs={filterDebounceMs}
        filterMinQueryLength={filterMinQueryLength}
      >
        {children}
      </CollectionContent>
    </CollectionProvider>
  );
}
