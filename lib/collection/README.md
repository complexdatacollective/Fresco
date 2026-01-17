# Collection Component System

A high-performance, accessible collection component for React with virtualization, keyboard navigation, selection management, and drag-and-drop support.

## Features

- **Unified API**: Single `Collection` component with virtualization controlled by layout
- **Virtualization**: Efficiently render lists with 10,000+ items using custom measurement-based virtualization
- **Selection**: Single, multiple, or no selection with keyboard and mouse support
- **Keyboard Navigation**: Full arrow key navigation with roving tabindex pattern
- **Accessibility**: WCAG-compliant with proper ARIA attributes and screen reader support
- **Layouts**: Built-in list and grid layouts with customizable sizing
- **Drag and Drop**: Optional DnD support for reordering and moving items
- **Type-safe**: Written in TypeScript with full type inference
- **Performance**: Optimized re-renders with Zustand state management

## Quick Start

### Basic Collection (Non-Virtualized)

```tsx
import { Collection, ListLayout } from '~/lib/collection';

type User = {
  id: string;
  name: string;
  email: string;
};

function UserList({ users }: { users: User[] }) {
  const layout = useMemo(() => new ListLayout<User>({ gap: 8 }), []);

  return (
    <Collection
      items={users}
      keyExtractor={(user) => user.id}
      layout={layout}
      renderItem={(user) => (
        <div className="p-2">
          <div>{user.name}</div>
          <div className="text-sm text-gray-500">{user.email}</div>
        </div>
      )}
    />
  );
}
```

### Virtualized Collection

For large lists (1,000+ items), enable virtualization on the layout:

```tsx
import { Collection, ListLayout } from '~/lib/collection';

function LargeUserList({ users }: { users: User[] }) {
  const layout = useMemo(
    () =>
      new ListLayout<User>({
        gap: 8,
        virtualized: true,
      }),
    [],
  );

  return (
    <div className="h-screen">
      <Collection
        items={users}
        keyExtractor={(user) => user.id}
        layout={layout}
        overscan={5} // Render 5 extra rows beyond viewport
        renderItem={(user) => (
          <div className="p-2">
            <div>{user.name}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        )}
      />
    </div>
  );
}
```

### Selection

Enable single or multiple selection:

```tsx
function SelectableUserList({ users }: { users: User[] }) {
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const layout = useMemo(() => new ListLayout<User>({ gap: 8 }), []);

  return (
    <Collection
      items={users}
      keyExtractor={(user) => user.id}
      layout={layout}
      selectionMode="multiple"
      selectedKeys={selectedKeys}
      onSelectionChange={setSelectedKeys}
      renderItem={(user, state) => (
        <div className={`p-2 ${state.isSelected ? 'bg-blue-100' : 'bg-white'}`}>
          <div>{user.name}</div>
          <div className="text-sm text-gray-500">{user.email}</div>
        </div>
      )}
    />
  );
}
```

## API Documentation

### Collection Props

| Prop                     | Type                                             | Default        | Description                                    |
| ------------------------ | ------------------------------------------------ | -------------- | ---------------------------------------------- |
| `items`                  | `T[]`                                            | **required**   | Array of items to render                       |
| `keyExtractor`           | `(item: T) => Key`                               | **required**   | Function to extract unique key from item       |
| `layout`                 | `Layout<T>`                                      | **required**   | Layout instance (ListLayout or GridLayout)     |
| `renderItem`             | `(item: T, state: ItemRenderState) => ReactNode` | **required**   | Render function for each item                  |
| `textValueExtractor`     | `(item: T) => string`                            | -              | Extract text for type-ahead search             |
| `emptyState`             | `ReactNode`                                      | `null`         | Content to show when items array is empty      |
| `className`              | `string`                                         | -              | CSS class name for the container               |
| `id`                     | `string`                                         | `'collection'` | ID for the collection (used for ARIA)          |
| `aria-label`             | `string`                                         | -              | Accessible label for the collection            |
| `aria-labelledby`        | `string`                                         | -              | ID of element that labels the collection       |
| `selectionMode`          | `'none' \| 'single' \| 'multiple'`               | `'none'`       | Selection mode                                 |
| `selectedKeys`           | `Set<Key>`                                       | -              | Controlled selected keys                       |
| `defaultSelectedKeys`    | `Set<Key>`                                       | -              | Default selected keys (uncontrolled)           |
| `onSelectionChange`      | `(keys: Set<Key>) => void`                       | -              | Callback when selection changes                |
| `disabledKeys`           | `Set<Key>`                                       | `new Set()`    | Keys of disabled items                         |
| `disallowEmptySelection` | `boolean`                                        | `false`        | Prevent deselecting all items                  |
| `overscan`               | `number`                                         | `5`            | Items to render outside viewport (virtualized) |
| `dragAndDropHooks`       | `DragAndDropHooks`                               | -              | Optional drag and drop configuration           |

### ItemRenderState

The `renderItem` function receives a state object with:

```typescript
type ItemRenderState = {
  isSelected: boolean; // Item is selected
  isFocused: boolean; // Item has keyboard focus
  isDisabled: boolean; // Item is disabled
  isDragging: boolean; // Item is being dragged
  isDropTarget: boolean; // Item is a drop target
};
```

## Selection

### Selection Modes

- **`none`**: No selection (default)
- **`single`**: Only one item can be selected
- **`multiple`**: Multiple items can be selected

### Controlled vs Uncontrolled

```tsx
// Controlled
const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
<Collection
  selectedKeys={selectedKeys}
  onSelectionChange={setSelectedKeys}
  ...
/>

// Uncontrolled
<Collection
  defaultSelectedKeys={new Set(['user-1', 'user-2'])}
  ...
/>
```

### Selection Hooks

Use hooks to access selection state from child components:

```tsx
import { useIsSelected, useIsFocused } from '~/lib/collection';

function UserItem({ user }: { user: User }) {
  const isSelected = useIsSelected(user.id);
  const isFocused = useIsFocused(user.id);

  return (
    <div className={isSelected ? 'bg-blue-100' : 'bg-white'}>{user.name}</div>
  );
}
```

## Keyboard Navigation

Collection implements the [roving tabindex pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/):

| Key                   | Action                                               |
| --------------------- | ---------------------------------------------------- |
| `↓` / `↑`             | Move focus to next/previous item                     |
| `Home` / `End`        | Move focus to first/last item                        |
| `Space` / `Enter`     | Toggle selection of focused item                     |
| `Ctrl+A` / `Cmd+A`    | Select all (multiple mode)                           |
| `Escape`              | Clear selection                                      |
| `Shift+↓` / `Shift+↑` | Extend selection (multiple mode)                     |
| Letters               | Type-ahead search (if `textValueExtractor` provided) |

### Customizing Keyboard Navigation

```tsx
import { useSelectableCollection, ListKeyboardDelegate } from '~/lib/collection';

// Disable select-all
<Collection
  selectionMode="multiple"
  disallowSelectAll={true}
  ...
/>

// Disable type-ahead
<Collection
  disallowTypeAhead={true}
  ...
/>
```

## Layouts

Layouts control both positioning strategy and virtualization. Set `virtualized: true` for large lists.

### List Layout

Vertical list layout with CSS flexbox (non-virtualized) or measurement-based virtualization:

```tsx
import { ListLayout } from '~/lib/collection';

// Non-virtualized (CSS flexbox)
const layout = new ListLayout<Item>({ gap: 8 });

// Virtualized (measures items automatically, 10k+ items)
const virtualizedLayout = new ListLayout<Item>({
  gap: 8,
  virtualized: true,
});

<Collection layout={layout} ... />
```

### Grid Layout

Responsive grid layout with CSS grid (non-virtualized) or measurement-based virtualization:

```tsx
import { GridLayout } from '~/lib/collection';

// Non-virtualized (CSS grid with auto-fill)
const layout = new GridLayout<Item>({
  minItemWidth: 200,  // Responsive columns calculated automatically
  gap: 16,
});

// Virtualized (measures items automatically, 1k+ items)
const virtualizedLayout = new GridLayout<Item>({
  minItemWidth: 200,
  gap: 16,
  virtualized: true,
});

<Collection layout={virtualizedLayout} ... />
```

### Custom Layouts

Implement the `Layout` interface for custom layouts:

```typescript
import { Layout, LayoutInfo, LayoutOptions } from '~/lib/collection';

class MyCustomLayout<T> extends Layout<T> {
  update(options: LayoutOptions): void {
    // Calculate layout positions
  }

  getLayoutInfo(key: Key): LayoutInfo | null {
    // Return position and size for item
  }
}
```

## Drag and Drop

Integration with the DnD system works with both virtualized and non-virtualized layouts:

```tsx
import { useDragAndDrop } from '~/lib/collection/dnd';
import { ListLayout } from '~/lib/collection';

function DraggableList({ items }: { items: Item[] }) {
  const [orderedItems, setOrderedItems] = useState(items);
  const layout = useMemo(() => new ListLayout<Item>({ gap: 8 }), []);

  const dragAndDropHooks = useDragAndDrop({
    items: orderedItems,
    onReorder: (event) => {
      const { keys, target } = event;
      // Handle reordering
      setOrderedItems(reorder(orderedItems, keys, target));
    },
  });

  return (
    <Collection
      items={orderedItems}
      layout={layout}
      dragAndDropHooks={dragAndDropHooks}
      ...
    />
  );
}
```

## Accessibility

### ARIA Attributes

Collections automatically include proper ARIA attributes:

- `role="listbox"` on container
- `role="option"` on items
- `aria-selected` on selected items
- `aria-disabled` on disabled items
- `aria-multiselectable` when `selectionMode="multiple"`
- `aria-activedescendant` for keyboard focus tracking

### Screen Reader Announcements

Selection changes and keyboard navigation are announced to screen readers automatically.

### Labels

Always provide an accessible label:

```tsx
// Option 1: aria-label
<Collection aria-label="User list" ... />

// Option 2: aria-labelledby
<>
  <h2 id="user-list-label">Users</h2>
  <Collection aria-labelledby="user-list-label" ... />
</>
```

## Performance

### Virtualization

For lists with 1,000+ items, enable virtualization on the layout:

```tsx
const layout = useMemo(
  () => new ListLayout<Item>({ gap: 8, virtualized: true }),
  []
);

<Collection items={largeArray} layout={layout} overscan={5} ... />
```

### Memoization

Items are automatically memoized with `React.memo`. For expensive render functions, use `useCallback`:

```tsx
const renderItem = useCallback((item: Item) => {
  return <ExpensiveComponent item={item} />;
}, []);
```

### Selection Performance

Selection state uses Zustand for efficient updates. Only items that changed selection state will re-render.

### Benchmark Results

On a 2020 M1 MacBook Pro:

- **50,000 items**: ~16ms initial render (virtualized)
- **Scroll FPS**: 60fps with 100,000 items
- **Selection change**: <5ms for 1,000 item selection

See `Performance.stories.tsx` for interactive benchmarks.

## Migration Guide

### From Basic List

```tsx
// Before
<ul>
  {users.map((user) => (
    <li key={user.id}>{user.name}</li>
  ))}
</ul>;

// After
const layout = useMemo(() => new ListLayout<User>({ gap: 8 }), []);

<Collection
  items={users}
  keyExtractor={(user) => user.id}
  layout={layout}
  renderItem={(user) => <div>{user.name}</div>}
/>;
```

### From VirtualizedCollection (Legacy)

The separate `VirtualizedCollection` component has been merged into `Collection`. Virtualization is now controlled by the layout:

```tsx
// Before
<VirtualizedCollection
  items={items}
  keyExtractor={(item) => item.id}
  layoutOptions={{ estimatedRowHeight: 48, gap: 8 }}
  renderItem={(item) => <div>{item.name}</div>}
/>;

// After
const layout = useMemo(
  () =>
    new ListLayout<Item>({ gap: 8, virtualized: true }),
  [],
);

<Collection
  items={items}
  keyExtractor={(item) => item.id}
  layout={layout}
  renderItem={(item) => <div>{item.name}</div>}
/>;
```

### From NodeList Component

If migrating from an existing `NodeList` component:

1. Replace `NodeList` with `Collection`
2. Change `nodes` prop to `items`
3. Add `layout` prop with appropriate layout
4. Rename item renderer to `renderItem`
5. Update selection props:
   - `onSelect` → `onSelectionChange`
   - `selectedNodes` → `selectedKeys`

```tsx
// Before
<NodeList
  nodes={nodes}
  selectedNodes={selected}
  onSelect={setSelected}
  renderNode={(node) => <NodeCard node={node} />}
/>;

// After
const layout = useMemo(() => new ListLayout<Node>({ gap: 8 }), []);

<Collection
  items={nodes}
  keyExtractor={(node) => node.id}
  layout={layout}
  selectedKeys={selected}
  onSelectionChange={setSelected}
  selectionMode="multiple"
  renderItem={(node) => <NodeCard node={node} />}
/>;
```

## Advanced Usage

### Custom Collection Provider

For advanced use cases, use `CollectionProvider` directly:

```tsx
import { CollectionProvider, useCollection } from '~/lib/collection';

function CustomCollectionView() {
  const collection = useCollection();

  return (
    <div>
      {Array.from(collection).map((node) => (
        <div key={node.key}>{node.textValue}</div>
      ))}
    </div>
  );
}

function App({ items }: { items: Item[] }) {
  return (
    <CollectionProvider
      items={items}
      keyExtractor={(item) => item.id}
      textValueExtractor={(item) => item.name}
    >
      <CustomCollectionView />
    </CollectionProvider>
  );
}
```

### Imperative Selection API

Access the SelectionManager imperatively:

```tsx
import { useSelectionManager } from '~/lib/collection';

function CustomControls() {
  const selectionManager = useSelectionManager();

  return (
    <button onClick={() => selectionManager.selectAll()}>Select All</button>
  );
}
```

## TypeScript

### Generic Type Inference

Collection automatically infers item types:

```tsx
type Product = { id: number; name: string };

<Collection<Product>
  items={products}
  keyExtractor={(product) => product.id} // product is Product
  renderItem={(product) => product.name} // product is Product
/>;
```

### Type Exports

```typescript
import type {
  CollectionProps,
  ItemRenderState,
  Key,
  SelectionMode,
  SelectionState,
} from '~/lib/collection';
```

## Examples

See the Storybook stories for complete examples:

- **Basic Usage**: `Collection.stories.tsx`
- **Selection**: `Selection.stories.tsx`
- **Keyboard Navigation**: `Keyboard.stories.tsx`
- **Layouts**: `Layout.stories.tsx`
- **Virtualization**: `Virtualization.stories.tsx`
- **Drag and Drop**: `DragAndDrop.stories.tsx`
- **Performance**: `Performance.stories.tsx`

## Troubleshooting

### Items not rendering

Ensure you're providing all required props:

- `items` array
- `keyExtractor` function
- `layout` instance
- `renderItem` function

### Selection not working

1. Check `selectionMode` is not `'none'`
2. Ensure `keyExtractor` returns unique keys
3. If controlled, verify `selectedKeys` and `onSelectionChange` are connected

### Virtualization issues

1. Ensure parent container has explicit height
2. Set `virtualized: true` on the layout
3. Check that items have content that gives them measurable dimensions
4. For InlineGridLayout, ensure items have explicit or intrinsic width/height

### Performance issues

1. Use `virtualized: true` on layout for lists >1000 items
2. Memoize `renderItem` with `useCallback`
3. Memoize layout instance with `useMemo`
4. Avoid expensive operations in render functions
5. Check browser DevTools Performance tab

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requires:

- ResizeObserver (for responsive layouts)
- IntersectionObserver (for virtualization)

## License

Part of the Fresco project. See project LICENSE.
