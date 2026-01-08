'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CollectionProvider } from '../CollectionProvider';
import { CollectionIdContext, SelectionManagerContext } from '../contexts';
import { useCollection } from '../hooks/useCollection';
import { useSelectionState } from '../hooks/useSelectionState';
import { ListKeyboardDelegate } from '../keyboard/ListKeyboardDelegate';
import { useSelectableCollection } from '../keyboard/useSelectableCollection';
import { type Layout } from '../layout/Layout';
import { GridLayout, type GridLayoutOptions } from '../layout/GridLayout';
import { ListLayout, type ListLayoutOptions } from '../layout/ListLayout';
import { type CollectionProps, type ItemRenderer, type Key } from '../types';
import { useVirtualizer } from '../virtualization/useVirtualizer';
import { VirtualizerItem } from '../virtualization/VirtualizerItem';
import { CollectionItem } from './CollectionItem';

type VirtualizedCollectionContentProps<T> = Omit<
  CollectionProps<T>,
  'items' | 'keyExtractor' | 'textValueExtractor'
> & {
  layout?: Layout<T>;
  layoutOptions?: ListLayoutOptions | GridLayoutOptions;
  layoutType?: 'list' | 'grid';
  overscan?: number;
};

function VirtualizedCollectionContent<T>({
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
  'layout': providedLayout,
  layoutOptions,
  layoutType = 'list',
  overscan,
}: VirtualizedCollectionContentProps<T>) {
  const collection = useCollection<T>();
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const selectionManager = useSelectionState({
    selectionMode,
    selectedKeys,
    defaultSelectedKeys,
    onSelectionChange,
    disabledKeys,
    disallowEmptySelection,
  });

  // Convert disabledKeys prop to Set for keyboard delegate
  const disabledKeysSet = useMemo(
    () => (disabledKeys ? new Set<Key>(disabledKeys) : new Set<Key>()),
    [disabledKeys],
  );

  // Create or use provided layout
  const layout = useMemo(() => {
    if (providedLayout) return providedLayout;
    if (layoutType === 'grid') {
      return new GridLayout<T>(layoutOptions as GridLayoutOptions);
    }
    return new ListLayout<T>(layoutOptions as ListLayoutOptions);
  }, [providedLayout, layoutOptions, layoutType]);

  // Observe container resize
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width =
          entry.borderBoxSize?.[0]?.inlineSize ?? entry.contentRect.width;
        setContainerWidth(width);
      }
    });

    resizeObserver.observe(scrollElement);
    setContainerWidth(scrollElement.clientWidth);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Update layout synchronously via useMemo (runs before virtualizer)
  // This ensures layout is updated BEFORE virtualItems are calculated
  const layoutVersion = useMemo(() => {
    const items = new Map(
      Array.from(collection).map((node) => [node.key, node]),
    );
    const orderedKeys = Array.from(collection.getKeys());
    layout.setItems(items, orderedKeys);
    layout.update({ containerWidth });
    // Return a unique value to track layout state
    return `${collection.size}-${containerWidth}-${layoutType}`;
  }, [collection, containerWidth, layout, layoutType]);

  const keyboardDelegate = useMemo(
    () => new ListKeyboardDelegate(collection, disabledKeysSet),
    [collection, disabledKeysSet],
  );

  const { collectionProps } = useSelectableCollection({
    selectionManager,
    keyboardDelegate,
    ref: scrollRef,
    disallowEmptySelection,
  });

  // Get focused key for persistence
  const persistedKeys = useMemo(() => {
    const keys = new Set<string | number>();
    if (selectionManager.focusedKey !== null) {
      keys.add(selectionManager.focusedKey);
    }
    return keys;
  }, [selectionManager.focusedKey]);

  const isGridLayout = layoutType === 'grid';

  // Setup virtualizer for list layouts
  const { virtualItems: listVirtualItems } = useVirtualizer({
    count: collection.size,
    getLayoutInfo: (index) => {
      // layoutVersion ensures we read fresh layout info after updates
      void layoutVersion;
      const keys = Array.from(collection.getKeys());
      const key = keys[index];
      return key ? layout.getLayoutInfo(key) : null;
    },
    scrollRef,
    overscan,
    persistedKeys,
  });

  // For grid layouts, calculate visible items directly from the layout
  // tanstack virtualizer assumes 1D layout, so we need custom logic for grids
  const [scrollTop, setScrollTop] = useState(0);

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement || !isGridLayout) return;

    const handleScroll = () => {
      setScrollTop(scrollElement.scrollTop);
    };

    scrollElement.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollElement.removeEventListener('scroll', handleScroll);
  }, [isGridLayout]);

  // Calculate grid virtual items based on visible rect
  const gridVirtualItems = useMemo(() => {
    if (!isGridLayout || containerWidth === 0) return [];

    const scrollElement = scrollRef.current;
    const viewportHeight = scrollElement?.clientHeight ?? 600;
    const overscanPixels = (overscan ?? 5) * 150;

    const visibleRect = {
      x: 0,
      y: Math.max(0, scrollTop - overscanPixels),
      width: containerWidth,
      height: viewportHeight + overscanPixels * 2,
    };

    const visibleInfos = layout.getVisibleLayoutInfos(visibleRect);
    const orderedKeys = Array.from(collection.getKeys());

    return visibleInfos.map((info) => ({
      key: info.key,
      index: orderedKeys.indexOf(info.key as string | number),
      layoutInfo: info,
    }));
    // layoutVersion is needed to trigger recalculation when layout is updated
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isGridLayout,
    containerWidth,
    scrollTop,
    layout,
    overscan,
    collection,
    layoutVersion,
  ]);

  // Use appropriate virtual items based on layout type
  const virtualItems = isGridLayout ? gridVirtualItems : listVirtualItems;

  // Get content size from layout
  const contentSize = layout.getContentSize();

  const collectionId = id ?? 'collection';

  // For grid layouts, don't render content until we have valid container dimensions
  // This prevents the initial render from creating a huge empty scrollable area
  const isWaitingForContainerSize = isGridLayout && containerWidth === 0;

  // Determine if we should show empty state
  const showEmptyState = collection.size === 0;

  return (
    <SelectionManagerContext.Provider value={selectionManager}>
      <CollectionIdContext.Provider value={collectionId}>
        <div
          ref={scrollRef}
          role="listbox"
          id={collectionId}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          aria-multiselectable={selectionMode === 'multiple' || undefined}
          aria-activedescendant={
            selectionManager.focusedKey !== null
              ? `${collectionId}-item-${selectionManager.focusedKey}`
              : undefined
          }
          className={className}
          style={{
            overflow: 'auto',
            height: '100%',
            width: '100%',
          }}
          {...collectionProps}
        >
          {showEmptyState ? (
            (emptyState ?? null)
          ) : isWaitingForContainerSize ? null : (
            <div
              ref={contentRef}
              style={{
                position: 'relative',
                height: contentSize.height,
                width: '100%',
              }}
            >
              {virtualItems.map((virtualItem) => {
                const node = collection.getItem(virtualItem.key);
                if (!node) return null;

                const isSelected = selectionManager.isSelected(node.key);
                const isFocused = selectionManager.focusedKey === node.key;
                const isDisabled = selectionManager.isDisabled(node.key);

                const itemState = {
                  isSelected,
                  isFocused,
                  isDisabled,
                  isDragging: false,
                  isDropTarget: false,
                };

                return (
                  <VirtualizerItem key={node.key} virtualItem={virtualItem}>
                    <CollectionItem itemKey={node.key} state={itemState}>
                      {renderItem(node.value, itemState)}
                    </CollectionItem>
                  </VirtualizerItem>
                );
              })}
            </div>
          )}
        </div>
      </CollectionIdContext.Provider>
    </SelectionManagerContext.Provider>
  );
}

export type VirtualizedCollectionProps<T> = CollectionProps<T> & {
  layout?: Layout<T>;
  layoutOptions?: ListLayoutOptions | GridLayoutOptions;
  layoutType?: 'list' | 'grid';
  overscan?: number;
};

/**
 * A virtualized variant of Collection that efficiently renders large lists.
 *
 * Uses @tanstack/react-virtual to render only visible items, providing
 * excellent performance for lists with thousands of items.
 *
 * @example
 * ```tsx
 * <VirtualizedCollection
 *   items={largeArray}
 *   keyExtractor={(item) => item.id}
 *   renderItem={(item) => <div>{item.name}</div>}
 *   layoutOptions={{ estimatedRowHeight: 48, gap: 8 }}
 * />
 * ```
 */
export function VirtualizedCollection<T>({
  items,
  keyExtractor,
  textValueExtractor,
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
  layout,
  layoutOptions,
  layoutType,
  overscan,
}: VirtualizedCollectionProps<T>) {
  return (
    <CollectionProvider
      items={items}
      keyExtractor={keyExtractor}
      textValueExtractor={textValueExtractor}
    >
      <VirtualizedCollectionContent
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
        layout={layout}
        layoutOptions={layoutOptions}
        layoutType={layoutType}
        overscan={overscan}
      />
    </CollectionProvider>
  );
}
