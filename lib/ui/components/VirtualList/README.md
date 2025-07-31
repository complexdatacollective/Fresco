# VirtualList Component

A high-performance virtualized list component with support for multiple layout modes, animations, drag & drop, selection, and comprehensive accessibility features.

## Basic Usage

```tsx
import { VirtualList } from './VirtualList';

const items = [
  { id: '1', name: 'Item 1' },
  { id: '2', name: 'Item 2' },
  // ... more items
];

<VirtualList
  items={items}
  keyExtractor={(item) => item.id}
  renderItem={({ item, style }) => <div style={style}>{item.name}</div>}
  layout={{
    mode: 'columns',
    columns: 3,
    gap: 16,
    itemHeight: 120,
  }}
  ariaLabel="My virtualized list"
/>;
```

## Layout Modes

### Grid Layout

Perfect for image galleries or card-based layouts.

```tsx
<VirtualList
  items={items}
  keyExtractor={(item) => item.id}
  renderItem={({ item, style }) => <Card item={item} style={style} />}
  layout={{
    mode: 'grid',
    itemSize: { width: 200, height: 150 },
    gap: 16,
  }}
  ariaLabel="Grid layout"
/>
```

### Column Layout

Great for responsive lists with fixed column counts.

```tsx
<VirtualList
  items={items}
  keyExtractor={(item) => item.id}
  renderItem={({ item, style }) => <ListItem item={item} style={style} />}
  layout={{
    mode: 'columns',
    columns: 4,
    gap: 12,
    itemHeight: 100,
  }}
  ariaLabel="Column layout"
/>
```

### Horizontal Layout

Ideal for horizontal scrolling lists.

```tsx
<VirtualList
  items={items}
  keyExtractor={(item) => item.id}
  renderItem={({ item, style }) => <HorizontalCard item={item} style={style} />}
  layout={{
    mode: 'horizontal',
    itemWidth: 180,
    itemHeight: 120,
    gap: 16,
  }}
  ariaLabel="Horizontal layout"
/>
```

## Features

### Selection

Enable item selection with visual feedback.

```tsx
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

<VirtualList
  items={items}
  keyExtractor={(item) => item.id}
  renderItem={({ item, style }) => (
    <SelectableItem
      item={item}
      style={style}
      isSelected={selectedIds.has(item.id)}
    />
  )}
  layout={{ mode: 'columns', columns: 3, gap: 12, itemHeight: 120 }}
  multiSelect={true}
  selectedItems={selectedIds}
  onItemSelect={(items) => {
    const newSelection = new Set(items.map((item) => item.id));
    setSelectedIds(newSelection);
  }}
  onItemClick={(item) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      newSet.has(item.id) ? newSet.delete(item.id) : newSet.add(item.id);
      return newSet;
    });
  }}
  ariaLabel="Selectable list"
/>;
```

### Drag & Drop

Enable drag and drop functionality with the DND system.

```tsx
<VirtualList
  items={items}
  keyExtractor={(item) => item.id}
  renderItem={({ item, style }) => <DraggableItem item={item} style={style} />}
  layout={{ mode: 'columns', columns: 2, gap: 16, itemHeight: 120 }}
  draggable={true}
  droppable={true}
  itemType="my-item"
  accepts={['my-item']}
  getDragMetadata={(item) => ({ item })}
  onDrop={(metadata) => console.log('Dropped:', metadata)}
  ariaLabel="Drag and drop list"
/>
```

### Animations

Add smooth enter/exit animations.

```tsx
<VirtualList
  items={items}
  keyExtractor={(item) => item.id}
  renderItem={({ item, style }) => <AnimatedItem item={item} style={style} />}
  layout={{ mode: 'grid', itemSize: { width: 180, height: 120 }, gap: 16 }}
  animations={{
    enter: {
      keyframes: {
        from: { opacity: 0, transform: 'translateY(20px)' },
        to: { opacity: 1, transform: 'translateY(0px)' },
      },
      timing: { duration: 300, delay: 0 },
      stagger: 50,
    },
    exit: {
      keyframes: {
        from: { opacity: 1, transform: 'translateY(0px)' },
        to: { opacity: 0, transform: 'translateY(-10px)' },
      },
      timing: { duration: 200, delay: 0 },
      stagger: 25,
    },
  }}
  ariaLabel="Animated list"
/>
```

## Props Reference

### Core Props

| Prop           | Type                                                                      | Required | Description                    |
| -------------- | ------------------------------------------------------------------------- | -------- | ------------------------------ |
| `items`        | `T[]`                                                                     | ✅       | Array of items to render       |
| `keyExtractor` | `(item: T, index: number) => string`                                      | ✅       | Function to extract unique key |
| `renderItem`   | `(props: {item: T, index: number, style: CSSProperties}) => ReactElement` | ✅       | Function to render each item   |
| `layout`       | `LayoutConfig`                                                            | ✅       | Layout configuration           |
| `ariaLabel`    | `string`                                                                  | ✅       | Accessibility label            |

### Layout Configuration

```typescript
type LayoutConfig =
  | { mode: 'grid'; itemSize: { width: number; height: number }; gap: number }
  | { mode: 'columns'; columns: number; gap: number; itemHeight: number }
  | { mode: 'horizontal'; itemWidth: number; itemHeight: number; gap: number };
```

### Optional Props

| Prop             | Type                                             | Default | Description                                |
| ---------------- | ------------------------------------------------ | ------- | ------------------------------------------ |
| `onItemClick`    | `(item: T, index: number) => void`               | -       | Item click handler                         |
| `EmptyComponent` | `React.ComponentType`                            | -       | Component to show when empty               |
| `placeholder`    | `React.ReactNode`                                | -       | Placeholder content                        |
| `overscan`       | `number`                                         | `5`     | Number of items to render outside viewport |
| `className`      | `string`                                         | -       | CSS class for container                    |
| `itemClassName`  | `string \| ((item: T, index: number) => string)` | -       | CSS class for items                        |

### Selection Props

| Prop            | Type                   | Default | Description              |
| --------------- | ---------------------- | ------- | ------------------------ |
| `multiSelect`   | `boolean`              | `false` | Enable multi-selection   |
| `selectedItems` | `Set<string>`          | -       | Currently selected items |
| `onItemSelect`  | `(items: T[]) => void` | -       | Selection change handler |

### Drag & Drop Props

| Prop              | Type                                   | Default | Description           |
| ----------------- | -------------------------------------- | ------- | --------------------- |
| `draggable`       | `boolean`                              | `false` | Enable dragging       |
| `droppable`       | `boolean`                              | `false` | Enable dropping       |
| `itemType`        | `string`                               | -       | DND item type         |
| `accepts`         | `string[]`                             | -       | Accepted drop types   |
| `getDragMetadata` | `(item: T) => Record<string, unknown>` | -       | Extract drag metadata |
| `getDragPreview`  | `(item: T) => ReactElement`            | -       | Custom drag preview   |
| `onDrop`          | `(metadata: unknown) => void`          | -       | Drop handler          |

### Animation Props

| Prop         | Type              | Default | Description             |
| ------------ | ----------------- | ------- | ----------------------- |
| `animations` | `AnimationConfig` | -       | Animation configuration |

```typescript
type AnimationConfig = {
  enter?: {
    keyframes: { from: CSSProperties; to: CSSProperties };
    timing: { duration: number; delay: number; easing?: string };
    stagger?: number;
  };
  exit?: {
    keyframes: { from: CSSProperties; to: CSSProperties };
    timing: { duration: number; delay: number; easing?: string };
    stagger?: number;
  };
};
```

### Accessibility Props

| Prop              | Type               | Default  | Description                 |
| ----------------- | ------------------ | -------- | --------------------------- |
| `ariaDescribedBy` | `string`           | -        | ARIA described-by attribute |
| `role`            | `'list' \| 'grid'` | `'list'` | ARIA role                   |

## Performance Tips

1. **Stable Keys**: Ensure `keyExtractor` returns stable, unique keys
2. **Memoize Render Function**: Use `useCallback` for `renderItem` when possible
3. **Optimize Item Components**: Memoize expensive item computations
4. **Control Overscan**: Adjust `overscan` based on your item complexity

## Examples

Check out the Storybook stories for interactive examples:

- **Layouts**: Different layout modes with interactive controls
- **Features**: Selection, drag & drop, animations, and accessibility demos

## TypeScript Support

The component is fully typed with generic support:

```typescript
interface MyItem {
  id: string;
  name: string;
  description: string;
}

<VirtualList<MyItem>
  items={myItems}
  keyExtractor={(item) => item.id}
  renderItem={({ item, style }) => (
    <div style={style}>
      <h3>{item.name}</h3>
      <p>{item.description}</p>
    </div>
  )}
  layout={{ mode: 'columns', columns: 2, gap: 16, itemHeight: 100 }}
  ariaLabel="My typed list"
/>
```
