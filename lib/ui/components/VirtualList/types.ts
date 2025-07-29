// Layout mode configurations
export type GridModeConfig = {
  mode: 'grid';
  itemSize: { width: number; height: number };
  gap: number;
};

export type ColumnModeConfig = {
  mode: 'columns';
  columns: number;
  gap: number;
  itemHeight: number;
};

export type HorizontalModeConfig = {
  mode: 'horizontal';
  itemHeight: number;
  itemWidth: number;
  gap: number;
};

export type LayoutConfig =
  | GridModeConfig
  | ColumnModeConfig
  | HorizontalModeConfig;

export type VirtualListProps<T> = {
  // Data
  items: T[];
  keyExtractor: (item: T, index: number) => string;

  // Rendering
  renderItem: (props: {
    item: T;
    index: number;
    style: React.CSSProperties;
  }) => React.ReactElement;

  // Layout (Phase 2: Support multiple modes, Phase 1 compatibility)
  layout?: LayoutConfig;
  itemHeight?: number; // Phase 1 compatibility - will be deprecated

  // Interaction
  onItemClick?: (item: T, index: number) => void;

  // Empty states
  EmptyComponent?: React.ComponentType;
  placeholder?: React.ReactNode;

  // Performance (Phase 2)
  overscan?: number;
  estimatedItemSize?: number;

  // Drag & Drop (Phase 4)
  draggable?: boolean;
  droppable?: boolean;
  itemType?: string;
  onDrop?: (metadata: unknown) => void;
  accepts?: string[];
  getDragMetadata?: (item: T) => Record<string, unknown>;
  getDragPreview?: (item: T) => React.ReactElement;

  // Styling
  className?: string;

  // Accessibility (Phase 5)
  ariaLabel: string;
  ariaDescribedBy?: string;
  role?: 'list' | 'grid';
  multiSelect?: boolean;
  onItemSelect?: (items: T[]) => void;

  // Additional class naming
  itemClassName?: string | ((item: T, index: number) => string);
};


