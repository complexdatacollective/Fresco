import { NcNode } from '@codaco/shared-consts';
import { GripVertical } from 'lucide-react';
import { ReactNode, useCallback, useMemo, useRef, useState } from 'react';
import {
  Button,
  Checkbox,
  GridLayout,
  GridList,
  GridListItem,
  isTextDropItem,
  Text,
  useDragAndDrop,
  Virtualizer,
} from 'react-aria-components';
import { cx } from '~/utils/cva';

/**
 * Hook to manage list items with stable unique IDs using a WeakMap.
 *
 * Tracks selected and disabled state
 */

/**
 * Managed properties added to array items for internal tracking.
 */
type ManagedProperties = {
  readonly _internalId: string;
  readonly _selected?: boolean;
  readonly _disabled?: boolean;
};

/**
 * Item with internal properties (_internalId and optional _draft flag) merged in.
 */
type WithItemProperties<T> = T & ManagedProperties;

function useListItems<T extends Record<string, unknown>>(
  rawItems: Iterable<T>,
  getId?: (item: T) => string,
) {
  const idMapRef = useRef<WeakMap<T, string>>(new WeakMap());

  // Helper to get or create an internal ID for an item
  const getInternalId = useCallback(
    (item: T): string => {
      // If getId is provided and returns a value, use it directly
      if (getId) {
        const existingId = getId(item);
        if (existingId !== undefined) {
          return existingId;
        }
      }
      // Otherwise, get or generate an internal id from the WeakMap
      let internalId = idMapRef.current.get(item);
      if (!internalId) {
        internalId = crypto.randomUUID();
        idMapRef.current.set(item, internalId);
      }
      return internalId;
    },
    [getId],
  );

  // Map raw items to items with internal IDs
  const items = useMemo(() => {
    const itemArray: WithItemProperties<T>[] = [];
    for (const item of rawItems) {
      const internalId = getInternalId(item);
      itemArray.push({
        ...item,
        _internalId: internalId,
      });
    }
    return itemArray;
  }, [rawItems, getInternalId]);

  return { items };
}

/**
 * Size class representing width and height dimensions.
 */
export class Size {
  width: number;
  height: number;
  constructor(width?: number, height?: number) {
    this.width = width ?? 0;
    this.height = height ?? 0;
  }
  /**
   * Returns a copy of this size.
   */
  copy(): Size {
    return new Size(this.width, this.height);
  }
  /**
   * Returns whether this size is equal to another one.
   */
  equals(other: Size): boolean {
    return this.width === other.width && this.height === other.height;
  }
  /**
   * The total area of the Size.
   */
  get area(): number {
    return this.width * this.height;
  }
}

type GridListProps<T> = {
  layout: 'grid' | 'list';
  keyboardNavigationBehaviour: 'arrow' | 'tab';
  children: ReactNode;
  items: Iterable<T>;
  renderEmptyState: () => ReactNode;
  selectionMode: 'none' | 'single' | 'multiple';
  selectedKeys: Set<T>; // Controlled currently selected items
  onSelectionChange: (selectedKeys: Set<T>) => void;
  disabledKeys: Set<T>;
  layoutOptions?: {
    minItemSize?: Size;
    minSpace?: Size;
    maxColumns?: number;
    preserveAspectRatio?: boolean;
  };
};

/**
 * A generic GridList component that can render items in either a grid or list layout.
 *
 * Virtualization is used to efficiently render large lists.
 *
 * an ItemComponent is provided to render each item.
 *
 * Interactions:
 * - Keyboard navigation based on the specified behaviour ('arrow' or 'tab').
 * - Selection modes: none, single, or multiple.
 * - Pressing escape clears the current selection.
 */
// export default function GridList<T extends Record<string, unknown>>(props: GridListProps<T>) {
//   const {
//     layout,
//     keyboardNavigationBehaviour,
//     children,
//     items: rawItems,
//     renderEmptyState,
//     selectionMode,
//     selectedKeys,
//     onSelectionChange,
//     disabledKeys,
//   } = props;

//   const { items, clearSelection, setSelected } = useListItems<T>(rawItems);

//   const keyboardHandlers = useKeyboardShortcuts(
//       [
//         [[Key.ArrowUp, Key.ArrowRight], handleIncrement],
//         [[Key.ArrowDown, Key.ArrowLeft], handleDecrement],
//         [
//           Key.Home,
//           () => {
//             if (minValue !== -Infinity) setValue(minValue);
//           },
//         ],
//         [
//           Key.End,
//           () => {
//             if (maxValue !== Infinity) setValue(maxValue);
//           },
//         ],
//       ],
//       {
//         disabled: state === 'disabled' || state === 'readOnly',
//       },
//     );

//   return (
//     <div
//       role="list"
//       className={cx(
//         ''
//       )}
//       tabIndex={0}
//       onKeyDown={(e) => {
//         if (e.key === 'Escape') {
//           if (isControlled) {
//             onSelectionChange(new Set());
//           } else {
//             setInternalSelectedKeys(new Set());
//           }
//         }
//       }}
//     >
//       {Array.from(items).length === 0 ? (
//         renderEmptyState()
//       ) : (
//         Array.from(items).map((item, index) => {
//           const key = item as unknown as T; // Assuming item can be used as key
//           const isSelected = currentSelectedKeys.has(key);
//           const isDisabled = disabledKeys.has(key);

//           return (
//             <div
//               key={index}
//               role="listitem"
//               tabIndex={isDisabled ? -1 : 0}
//               className={`grid-list-item ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
//               onClick={() => {
//                 if (!isDisabled) {
//                   handleSelectionChange(key);
//                 }
//               }}
//               onKeyDown={(e) => {
//                 if (!isDisabled && (e.key === 'Enter' || e.key === ' ')) {
//                   e.preventDefault();
//                   handleSelectionChange(key);
//                 }
//               }}
//             >
//               {typeof children === 'function' ? children(item) : children}
//             </div>
//           );
//         })
//       )}
//     </div>
//   );
// }

const testItems: NcNode[] = [
  {
    _uid: '1',
    id: '1',
    type: 'Person',
    attributes: { name: 'Alice' },
  },
  {
    _uid: '2',
    id: '2',
    type: 'Person',
    attributes: { name: 'Bob' },
  },
  {
    _uid: '3',
    id: '3',
    type: 'Person',
    attributes: { name: 'Charlie' },
  },
  {
    _uid: '4',
    id: '4',
    type: 'Person',
    attributes: { name: 'Diana' },
  },
];

function NodeList({ initialItems = [] }: { initialItems?: NcNode[] }) {
  let [items, setItems] = useState<NcNode[]>(initialItems);

  let { dragAndDropHooks } = useDragAndDrop<NcNode>({
    acceptedDragTypes: ['node'],
    // Presence of getItems turns on drag source functionality
    getItems(keys, items) {
      return items.map((item) => {
        return {
          'text/plain': `${item.attributes.name} – ${item.type}`,
          'text/html': `<strong>${item.attributes.name}</strong> – <em>${item.type}</em>`,
          // NOTE: in future we can use this for custom serialisation of things
          // such as stage collections so that they can be dragged or copied
          // protocols
          'node': JSON.stringify(item),
        };
      });
    },
    // Presence of onDrop || onInsert || onItemDrop || onReorder || onMove || onRootDrop turns on
    // drop target functionality
    async onRootDrop(e) {
      const items = await Promise.all(
        e.items
          .filter(isTextDropItem)
          .map(async (item) => JSON.parse(await item.getText('node'))),
      );
      setItems(items);
    },
    renderDragPreview(items) {
      return (
        <div className="bg-accent text-accent-contrast rounded p-2 shadow-lg">
          {items[0]['text/plain']}
          <span className="badge">{items.length}</span>
        </div>
      );
    },
  });

  return (
    <Virtualizer
      layout={GridLayout}
      layoutOptions={{
        minItemSize: new Size(100, 140),
        minSpace: new Size(8, 8),
        maxColumns: Infinity,
        preserveAspectRatio: false,
      }}
      // {...props}
    >
      <GridList
        aria-label="Node list"
        selectionMode="single"
        items={items}
        renderEmptyState={() => 'Drop nodes here'}
        dragAndDropHooks={dragAndDropHooks}
        className={cx(
          'flex flex-wrap content-start',
          'max-h-[500px] min-h-96 w-full gap-4 overflow-auto rounded p-2',
          'transition-colors duration-300',
          'data-will-accept:bg-barbie-pink-dark',
          'data-drop-target:bg-barbie-pink',
        )}
        style={{ display: 'block', padding: 0, height: 300, width: '100%' }}
      >
        {(item) => (
          <GridListItem
            textValue={item.attributes.name as string}
            style={{ height: '100%' }}
            className={cx(
              'flex max-w-[250px] flex-col transition-transform duration-300',
              'data-focus-visible:outline-2',
              'data-pressed:scale-95',
            )}
          >
            {({ selectionMode, selectionBehavior, allowsDragging }) => (
              <>
                {/* Add elements for drag and drop and selection. */}
                {allowsDragging && (
                  <Button slot="drag">
                    <GripVertical size={16} />
                  </Button>
                )}
                {selectionMode === 'multiple' &&
                  selectionBehavior === 'toggle' && (
                    <Checkbox slot="selection" />
                  )}
                <Text>{item.attributes.name as string}</Text>
                <Text slot="description">{item._uid}</Text>
              </>
            )}
          </GridListItem>
        )}
      </GridList>
    </Virtualizer>
  );
}

/**
 * Typical scenario usage of the GridList component is as a node list.
 *
 * This shows two node lists and allows dragging between them and selection of nodes
 * in one of the lists.
 */
function GridListExample() {
  return (
    <div className="flex h-full">
      <div className="w-1/2 border p-4">
        <h2 className="mb-2">Left Node List</h2>
        <NodeList initialItems={testItems} />
      </div>
      <div className="w-1/2 border p-4">
        <h2 className="mb-2">Right Node List</h2>
        <NodeList />
      </div>
    </div>
  );
}

// Export storybook story
export default {
  title: 'GridList',
  component: GridListExample,
};

export const Default = {
  render: () => <GridListExample />,
};
