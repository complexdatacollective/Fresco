import { memo, useCallback, useRef } from 'react';
import {
  CollectionItemContext,
  useCollectionId,
  useSelectionManager,
} from '../contexts';
import { useSelectableItem } from '../hooks/useSelectableItem';
import { type Layout } from '../layout/Layout';
import {
  type CollectionProps,
  type ItemProps,
  type ItemRenderer,
  type Node,
} from '../types';

type CollectionItemProps<T> = {
  node: Node<T>;
  renderItem: ItemRenderer<T>;
  dragAndDropHooks?: CollectionProps<T>['dragAndDropHooks'];
  layout: Layout<T>;
};

function CollectionItemComponent<T>({
  node,
  renderItem,
  dragAndDropHooks,
  layout,
}: CollectionItemProps<T>) {
  const selectionManager = useSelectionManager();
  const collectionId = useCollectionId() ?? 'collection';
  const localRef = useRef<HTMLElement>(null);

  const { itemProps, isSelected, isFocused, isDisabled } = useSelectableItem({
    key: node.key,
    selectionManager,
    ref: localRef,
  });

  // Get item-level drag props if hooks provided
  const dndDragPropsRaw = dragAndDropHooks?.useDraggableItemProps
    ? dragAndDropHooks.useDraggableItemProps(node.key)
    : {};

  // Extract DnD props, excluding ones that would override Collection's accessibility semantics:
  // - tabIndex: Collection uses roving tabindex (-1), DnD sets 0
  // - role: Collection uses 'option', DnD sets 'button'
  // - aria-label: Should come from rendered item (e.g., Node's label), not DnD's announcedName
  // - onKeyDown: Must be composed with Collection's handler (extracted separately below)
  const {
    'ref': dragRef,
    'tabIndex': dndTabIndex,
    'role': dndRole,
    'aria-label': dndAriaLabel,
    'onKeyDown': dndOnKeyDown,
    ...dndDragProps
  } = dndDragPropsRaw as {
    'ref'?: (el: HTMLElement | null) => void;
    'tabIndex'?: number;
    'role'?: string;
    'aria-label'?: string;
    'onKeyDown'?: React.KeyboardEventHandler<HTMLElement>;
    [key: string]: unknown;
  };
  // These DnD props are intentionally unused - Collection overrides them
  void dndTabIndex;
  void dndRole;
  void dndAriaLabel;

  // Compose keyboard handlers: DnD handler runs first to handle drag operations,
  // then Collection's handler for selection (if not handled by DnD).
  // This order is important because:
  // - During drag mode: DnD handles Enter/Space for drop, arrow keys for navigation
  // - Normal mode: DnD only handles Ctrl+D/Alt+Space, Collection handles Enter/Space for selection
  const composedOnKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      // DnD handler first - it will preventDefault/stopPropagation if it handles the event
      if (dndOnKeyDown) {
        dndOnKeyDown(e);
      }
      // Only call Collection handler if DnD didn't handle the event
      if (!e.defaultPrevented) {
        itemProps.onKeyDown?.(e);
      }
    },
    [dndOnKeyDown, itemProps],
  );

  // Combined ref callback that also registers the element with the layout
  const combinedRef = useCallback(
    (el: HTMLElement | null) => {
      (localRef as React.MutableRefObject<HTMLElement | null>).current = el;
      if (dragRef) {
        dragRef(el);
      }
      // Register the element with the layout for DOM-based position queries
      layout.registerItemRef(node.key, el);
    },
    [dragRef, layout, node.key],
  );

  const itemId = `${collectionId}-item-${node.key}`;
  const contextValue = { key: node.key };

  // Build ItemProps to pass to renderItem
  const fullItemProps: ItemProps = {
    'ref': combinedRef,
    'tabIndex': itemProps.tabIndex,
    'role': 'option',
    'aria-selected': isSelected || undefined,
    'aria-disabled': isDisabled || undefined,
    'data-collection-item': true,
    'data-selected': isSelected || undefined,
    'data-focused': isFocused || undefined,
    'data-disabled': isDisabled || undefined,
    'data-dragging': undefined,
    'data-drop-target': undefined,
    'onFocus': itemProps.onFocus,
    'onClick': itemProps.onClick,
    'onKeyDown': composedOnKeyDown,
    'onPointerDown': dndDragProps.onPointerDown as
      | React.PointerEventHandler<Element>
      | undefined,
    'onPointerMove': dndDragProps.onPointerMove as
      | React.PointerEventHandler<Element>
      | undefined,
    'id': itemId,
    ...dndDragProps,
  };

  return (
    <CollectionItemContext.Provider value={contextValue}>
      {renderItem(node.value, fullItemProps)}
    </CollectionItemContext.Provider>
  );
}

export const CollectionItem = memo(
  CollectionItemComponent,
) as typeof CollectionItemComponent;
