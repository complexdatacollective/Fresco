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

// Animation configuration
export type AnimationTiming = {
  duration: number;
  delay: number;
  easing?: string;
};

export type AnimationKeyframes = {
  from: React.CSSProperties;
  to: React.CSSProperties;
};

export type AnimationConfig = {
  enter?: {
    keyframes: AnimationKeyframes;
    timing: AnimationTiming;
    stagger?: number;
  };
  exit?: {
    keyframes: AnimationKeyframes;
    timing: AnimationTiming;
    stagger?: number;
  };
  disabled?: boolean;
};

// Additional utility types for the architecture
export type Size = {
  width: number;
  height: number;
};

export type ItemRenderer<T> = (props: {
  item: T;
  index: number;
  style: React.CSSProperties;
}) => React.ReactElement;

export type VirtualizerConfig = {
  horizontal: boolean;
  count: number;
  estimateSize: () => number;
  itemsPerRow?: number;
  columns?: number;
  columnWidth?: number;
};

export type DragDropProps<T> = {
  draggable?: boolean;
  droppable?: boolean;
  itemType?: string;
  onDrop?: (metadata: unknown) => void;
  accepts?: string[];
  getDragMetadata?: (item: T) => Record<string, unknown>;
  getDragPreview?: (item: T) => React.ReactElement;
};

export type SelectionProps<T> = {
  multiSelect?: boolean;
  selectedItems?: Set<string>;
  onItemSelect?: (items: T[]) => void;
};

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

  // Animations (Phase 6)
  animations?: AnimationConfig;

  // Accessibility (Phase 5)
  ariaLabel: string;
  ariaDescribedBy?: string;
  role?: 'list' | 'grid';
  multiSelect?: boolean;
  onItemSelect?: (items: T[]) => void;
  selectedItems?: Set<string>;

  // Additional class naming
  itemClassName?: string | ((item: T, index: number) => string);
};


