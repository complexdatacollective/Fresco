import { useDropTarget } from '~/lib/dnd';
import { cn } from '~/utils/shadcn';

export type MockItem = {
  id: string;
  name: string;
};

export const mockItems: MockItem[] = Array.from({ length: 10000 }, (_, i) => ({
  id: `item-${i}`,
  name: `Item ${i + 1}`,
}));

export const ItemComponent = ({
  item,
  style,
}: {
  item: MockItem;
  style?: React.CSSProperties;
}) => (
  <div
    style={{
      ...style,
    }}
    className="bg-navy-taupe focus:ring-accent focus:ring-offset-background m-2 rounded-lg px-4 py-6 text-white transition-opacity duration-200 select-none focus:ring-2 focus:ring-offset-2 focus:outline-none"
  >
    {item.name}
  </div>
);

// Drop target component for drag and drop stories
export const DropTarget = ({
  onDrop,
  droppedItems,
}: {
  onDrop: (metadata: unknown) => void;
  droppedItems: MockItem[];
}) => {
  const { dropProps, isOver, willAccept } = useDropTarget({
    id: 'story-drop-target',
    accepts: ['mock-item'],
    announcedName: 'Drop target for virtual list items',
    onDrop,
  });

  return (
    <div
      {...dropProps}
      style={{
        flex: 1,
        minHeight: '200px',
        border: '2px dashed',
        borderRadius: '8px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        transition: 'all 0.2s',
        borderColor: isOver && willAccept ? '#2196f3' : '#ccc',
        backgroundColor: isOver && willAccept ? '#e3f2fd' : '#f9f9f9',
      }}
    >
      <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
        Drop items here ({droppedItems.length} items)
      </div>
      {droppedItems.map((item, index) => (
        <div
          key={`${item.id}-${index}`}
          style={{
            padding: '8px 12px',
            backgroundColor: '#2196f3',
            color: 'white',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold',
          }}
        >
          {item.name}
        </div>
      ))}
      {droppedItems.length === 0 && (
        <div
          style={{
            fontSize: '14px',
            color: '#999',
            textAlign: 'center',
            fontStyle: 'italic',
            marginTop: '20px',
          }}
        >
          Drag items from the list above to drop them here
        </div>
      )}
    </div>
  );
};

// Selectable item component for selection stories
export const SelectableItemComponent = ({
  item,
  style,
  isSelected,
}: {
  item: MockItem;
  style?: React.CSSProperties;
  isSelected: boolean;
}) => (
  <div
    style={{
      ...style,
    }}
    className={cn(
      'm-2 cursor-pointer rounded-lg px-4 py-3 text-white transition-opacity duration-200 select-none',
      'focus:ring-accent focus:ring-offset-background focus:ring-2 focus:ring-offset-2 focus:outline-none',
      isSelected ? 'bg-accent' : 'bg-navy-taupe',
      isSelected && 'ring-2 ring-white ring-offset-2 ring-offset-transparent',
    )}
  >
    <div
      style={{
        fontWeight: isSelected ? 'bold' : 'normal',
      }}
    >
      {item.name}
    </div>
    {isSelected && (
      <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.9 }}>
        ✓ Selected
      </div>
    )}
  </div>
);
