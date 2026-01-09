'use client';

import { useRef } from 'react';
import { ScrollArea } from '~/components/ui/ScrollArea';
import { CollectionProvider } from '../CollectionProvider';
import { CollectionIdContext, SelectionManagerContext } from '../contexts';
import { useCollectionSetup } from '../hooks/useCollectionSetup';
import { type CollectionProps, type ItemRenderer } from '../types';
import { StaticRenderer } from './StaticRenderer';

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
  dragAndDropHooks,
}: CollectionContentProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Use shared setup hook for selection, keyboard, DnD
  const { collection, selectionManager, collectionProps, dndCollectionProps } =
    useCollectionSetup<T>(
      {
        selectionMode,
        selectedKeys,
        defaultSelectedKeys,
        onSelectionChange,
        disabledKeys,
        disallowEmptySelection,
        dragAndDropHooks,
        layout,
      },
      containerRef,
    );

  // Render empty state if collection is empty
  if (collection.size === 0) {
    return emptyState ? <>{emptyState}</> : null;
  }

  const collectionId = id ?? 'collection';

  return (
    <SelectionManagerContext.Provider value={selectionManager}>
      <CollectionIdContext.Provider value={collectionId}>
        <ScrollArea className={className}>
          <div
            ref={containerRef}
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
            {...collectionProps}
            {...dndCollectionProps}
          >
            <StaticRenderer
              layout={layout}
              collection={collection}
              selectionManager={selectionManager}
              renderItem={renderItem}
              dragAndDropHooks={dragAndDropHooks}
            />
          </div>
        </ScrollArea>
      </CollectionIdContext.Provider>
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
  dragAndDropHooks,
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
        dragAndDropHooks={dragAndDropHooks}
      />
    </CollectionProvider>
  );
}
