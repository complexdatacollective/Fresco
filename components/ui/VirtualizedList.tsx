'use client';

import { ScrollArea as BaseScrollArea } from '@base-ui-components/react/scroll-area';
import { useVirtualizer, type VirtualItem } from '@tanstack/react-virtual';
import { cva, type VariantProps } from 'class-variance-authority';
import { AnimatePresence, motion, type Variants } from 'motion/react';
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { cn } from '~/utils/shadcn';

// ============================================================================
// Types
// ============================================================================

type LayoutMode = 'list' | 'grid' | 'horizontal';

type SelectionMode = 'none' | 'single' | 'multiple';

type ResponsiveColumns = {
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  '2xl'?: number;
};

type SizingMode =
  | { type: 'dynamic'; estimateSize: number }
  | { type: 'fixed'; itemSize: number };

type AnimationMode =
  | 'none'
  | 'staggered'
  | 'fade'
  | 'slide'
  | 'scale'
  | 'custom';

type VirtualizedListContextValue<T> = {
  items: T[];
  selectedKeys: Set<string>;
  focusedIndex: number;
  layout: LayoutMode;
  selectionMode: SelectionMode;
  getItemKey: (item: T, index: number) => string;
  onSelectionChange?: (keys: Set<string>) => void;
  onItemClick?: (item: T, index: number) => void;
  setFocusedIndex: (index: number) => void;
  toggleSelection: (key: string) => void;
  selectOnly: (key: string) => void;
  selectRange: (startIndex: number, endIndex: number) => void;
  isAnimationComplete: boolean;
  animationMode: AnimationMode;
};

// ============================================================================
// Context
// ============================================================================

const VirtualizedListContext = createContext<VirtualizedListContextValue<unknown> | null>(null);

function useVirtualizedListContext<T>() {
  const context = useContext(VirtualizedListContext) as VirtualizedListContextValue<T> | null;
  if (!context) {
    throw new Error('useVirtualizedListContext must be used within VirtualizedList');
  }
  return context;
}

// ============================================================================
// Animation Variants
// ============================================================================

const staggeredVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: Math.min(index * 0.03, 0.3),
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } },
};

const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const slideVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.25 } },
  exit: { opacity: 0, x: 20, transition: { duration: 0.15 } },
};

const scaleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, scale: 0.8, transition: { duration: 0.15 } },
};

const getAnimationVariants = (mode: AnimationMode): Variants | undefined => {
  switch (mode) {
    case 'staggered':
      return staggeredVariants;
    case 'fade':
      return fadeVariants;
    case 'slide':
      return slideVariants;
    case 'scale':
      return scaleVariants;
    case 'none':
    case 'custom':
    default:
      return undefined;
  }
};

// ============================================================================
// Scrollbar Styles
// ============================================================================

const scrollbarClasses = cn(
  'absolute z-10 m-1 flex',
  'rounded-[1rem]',
  'bg-current/10 opacity-0',
  'pointer-events-none transition-opacity duration-250',
  'data-[hovering]:pointer-events-auto data-[hovering]:opacity-100 data-[hovering]:duration-75',
  'data-[scrolling]:pointer-events-auto data-[scrolling]:opacity-100 data-[scrolling]:duration-75',
);

const verticalScrollbarClasses = cn(
  scrollbarClasses,
  'top-0 right-0 bottom-0',
  'w-[0.25rem] md:w-[0.325rem]',
);

const horizontalScrollbarClasses = cn(
  scrollbarClasses,
  'right-0 bottom-0 left-0',
  'h-[0.25rem] md:h-[0.325rem]',
);

const thumbClasses = cn(
  'rounded-[inherit] bg-current',
  'before:absolute before:top-1/2 before:left-1/2',
  'before:h-[calc(100%+1rem)] before:w-[calc(100%+1rem)]',
  'before:-translate-x-1/2 before:-translate-y-1/2',
  'before:content-[""]',
);

// ============================================================================
// Item Variants
// ============================================================================

const itemVariants = cva(
  'relative outline-none transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary',
  {
    variants: {
      selectable: {
        true: 'cursor-pointer',
        false: 'cursor-default',
      },
      selected: {
        true: 'bg-accent/10 ring-2 ring-accent ring-inset',
        false: '',
      },
      focused: {
        true: '',
        false: '',
      },
    },
    defaultVariants: {
      selectable: false,
      selected: false,
      focused: false,
    },
  },
);

// ============================================================================
// Container Variants
// ============================================================================

const containerVariants = cva(
  'relative flex min-h-0 flex-1 focus-within:outline-none',
  {
    variants: {
      layout: {
        list: '',
        grid: '',
        horizontal: '',
      },
    },
    defaultVariants: {
      layout: 'list',
    },
  },
);

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to calculate number of columns based on container width and responsive breakpoints
 */
function useResponsiveColumns(
  containerRef: React.RefObject<HTMLElement | null>,
  responsiveColumns?: ResponsiveColumns,
  fixedColumns?: number,
): number {
  const [columns, setColumns] = useState(fixedColumns ?? 1);

  useEffect(() => {
    if (fixedColumns !== undefined || !responsiveColumns) {
      setColumns(fixedColumns ?? 1);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const updateColumns = () => {
      const width = container.clientWidth;
      // Default Tailwind breakpoints
      if (width >= 1536 && responsiveColumns['2xl']) {
        setColumns(responsiveColumns['2xl']);
      } else if (width >= 1280 && responsiveColumns.xl) {
        setColumns(responsiveColumns.xl);
      } else if (width >= 1024 && responsiveColumns.lg) {
        setColumns(responsiveColumns.lg);
      } else if (width >= 768 && responsiveColumns.md) {
        setColumns(responsiveColumns.md);
      } else if (width >= 640 && responsiveColumns.sm) {
        setColumns(responsiveColumns.sm);
      } else if (responsiveColumns.xs) {
        setColumns(responsiveColumns.xs);
      } else {
        // Find the first defined value as fallback
        const firstDefined = Object.values(responsiveColumns).find((v) => v !== undefined);
        setColumns(firstDefined ?? 1);
      }
    };

    const resizeObserver = new ResizeObserver(updateColumns);
    resizeObserver.observe(container);
    updateColumns();

    return () => resizeObserver.disconnect();
  }, [containerRef, responsiveColumns, fixedColumns]);

  return columns;
}

/**
 * Hook to calculate item width based on container width and static item size
 */
function useAutoColumns(
  containerRef: React.RefObject<HTMLElement | null>,
  itemWidth?: number,
  gap = 0,
): number {
  const [columns, setColumns] = useState(1);

  useEffect(() => {
    if (!itemWidth) {
      setColumns(1);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const updateColumns = () => {
      const containerWidth = container.clientWidth;
      const minCols = Math.max(1, Math.floor((containerWidth + gap) / (itemWidth + gap)));
      setColumns(minCols);
    };

    const resizeObserver = new ResizeObserver(updateColumns);
    resizeObserver.observe(container);
    updateColumns();

    return () => resizeObserver.disconnect();
  }, [containerRef, itemWidth, gap]);

  return columns;
}

// ============================================================================
// VirtualizedItem Component
// ============================================================================

type VirtualizedItemProps<T> = {
  item: T;
  index: number;
  virtualItem: VirtualItem;
  children: (item: T, index: number, props: VirtualizedItemRenderProps) => ReactNode;
  isHorizontal?: boolean;
  style?: React.CSSProperties;
  customVariants?: Variants;
};

type VirtualizedItemRenderProps = {
  isSelected: boolean;
  isFocused: boolean;
  select: () => void;
  toggleSelect: () => void;
};

function VirtualizedItemInner<T>(
  {
    item,
    index,
    virtualItem,
    children,
    isHorizontal = false,
    style,
    customVariants,
  }: VirtualizedItemProps<T>,
  measureRef: React.Ref<HTMLDivElement>,
) {
  const {
    selectedKeys,
    focusedIndex,
    selectionMode,
    getItemKey,
    toggleSelection,
    selectOnly,
    setFocusedIndex,
    onItemClick,
    isAnimationComplete,
    animationMode,
  } = useVirtualizedListContext<T>();

  const key = getItemKey(item, index);
  const isSelected = selectedKeys.has(key);
  const isFocused = focusedIndex === index;
  const isSelectable = selectionMode !== 'none';

  const handleClick = useCallback(() => {
    if (isSelectable) {
      if (selectionMode === 'multiple') {
        toggleSelection(key);
      } else {
        selectOnly(key);
      }
    }
    onItemClick?.(item, index);
    setFocusedIndex(index);
  }, [isSelectable, selectionMode, toggleSelection, selectOnly, key, onItemClick, item, index, setFocusedIndex]);

  const renderProps: VirtualizedItemRenderProps = {
    isSelected,
    isFocused,
    select: () => selectOnly(key),
    toggleSelect: () => toggleSelection(key),
  };

  const positionStyle: React.CSSProperties = isHorizontal
    ? {
        position: 'absolute',
        top: 0,
        left: 0,
        height: '100%',
        width: `${virtualItem.size}px`,
        transform: `translateX(${virtualItem.start}px)`,
        ...style,
      }
    : {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: `${virtualItem.size}px`,
        transform: `translateY(${virtualItem.start}px)`,
        ...style,
      };

  const variants = customVariants ?? getAnimationVariants(animationMode);
  const shouldAnimate = animationMode !== 'none' && variants;

  const content = (
    <div
      ref={measureRef}
      role={isSelectable ? 'option' : undefined}
      aria-selected={isSelectable ? isSelected : undefined}
      tabIndex={isFocused ? 0 : -1}
      onClick={handleClick}
      className={itemVariants({
        selectable: isSelectable,
        selected: isSelected,
        focused: isFocused,
      })}
      style={positionStyle}
      data-index={index}
      data-selected={isSelected}
      data-focused={isFocused}
    >
      {children(item, index, renderProps)}
    </div>
  );

  if (shouldAnimate) {
    return (
      <motion.div
        key={key}
        custom={index}
        variants={variants}
        initial={!isAnimationComplete ? 'hidden' : false}
        animate="visible"
        exit="exit"
        style={{ display: 'contents' }}
      >
        {content}
      </motion.div>
    );
  }

  return content;
}

const VirtualizedItem = forwardRef(VirtualizedItemInner) as <T>(
  props: VirtualizedItemProps<T> & { ref?: React.Ref<HTMLDivElement> },
) => ReactNode;

// ============================================================================
// VirtualizedGrid Component (for grid layout)
// ============================================================================

type VirtualizedGridItemProps<T> = {
  item: T;
  index: number;
  virtualRow: VirtualItem;
  columnIndex: number;
  columns: number;
  gap: number;
  children: (item: T, index: number, props: VirtualizedItemRenderProps) => ReactNode;
  customVariants?: Variants;
};

function VirtualizedGridItemInner<T>(
  {
    item,
    index,
    virtualRow,
    columnIndex,
    columns,
    gap,
    children,
    customVariants,
  }: VirtualizedGridItemProps<T>,
  measureRef: React.Ref<HTMLDivElement>,
) {
  const {
    selectedKeys,
    focusedIndex,
    selectionMode,
    getItemKey,
    toggleSelection,
    selectOnly,
    setFocusedIndex,
    onItemClick,
    isAnimationComplete,
    animationMode,
  } = useVirtualizedListContext<T>();

  const key = getItemKey(item, index);
  const isSelected = selectedKeys.has(key);
  const isFocused = focusedIndex === index;
  const isSelectable = selectionMode !== 'none';

  const handleClick = useCallback(() => {
    if (isSelectable) {
      if (selectionMode === 'multiple') {
        toggleSelection(key);
      } else {
        selectOnly(key);
      }
    }
    onItemClick?.(item, index);
    setFocusedIndex(index);
  }, [isSelectable, selectionMode, toggleSelection, selectOnly, key, onItemClick, item, index, setFocusedIndex]);

  const renderProps: VirtualizedItemRenderProps = {
    isSelected,
    isFocused,
    select: () => selectOnly(key),
    toggleSelect: () => toggleSelection(key),
  };

  const columnWidth = `calc((100% - ${(columns - 1) * gap}px) / ${columns})`;
  const leftOffset = `calc(${columnIndex} * (${columnWidth} + ${gap}px))`;

  const variants = customVariants ?? getAnimationVariants(animationMode);
  const shouldAnimate = animationMode !== 'none' && variants;

  const content = (
    <div
      ref={measureRef}
      role={isSelectable ? 'option' : undefined}
      aria-selected={isSelectable ? isSelected : undefined}
      tabIndex={isFocused ? 0 : -1}
      onClick={handleClick}
      className={itemVariants({
        selectable: isSelectable,
        selected: isSelected,
        focused: isFocused,
      })}
      style={{
        position: 'absolute',
        top: 0,
        left: leftOffset,
        width: columnWidth,
        height: `${virtualRow.size}px`,
        transform: `translateY(${virtualRow.start}px)`,
      }}
      data-index={index}
      data-selected={isSelected}
      data-focused={isFocused}
    >
      {children(item, index, renderProps)}
    </div>
  );

  if (shouldAnimate) {
    return (
      <motion.div
        key={key}
        custom={index}
        variants={variants}
        initial={!isAnimationComplete ? 'hidden' : false}
        animate="visible"
        exit="exit"
        style={{ display: 'contents' }}
      >
        {content}
      </motion.div>
    );
  }

  return content;
}

const VirtualizedGridItem = forwardRef(VirtualizedGridItemInner) as <T>(
  props: VirtualizedGridItemProps<T> & { ref?: React.Ref<HTMLDivElement> },
) => ReactNode;

// ============================================================================
// VirtualizedList Component
// ============================================================================

type VirtualizedListProps<T> = {
  /** Items to render in the list */
  items: T[];
  /** Function to extract a unique key from each item */
  getItemKey: (item: T, index: number) => string;
  /** Render function for each item */
  children: (item: T, index: number, props: VirtualizedItemRenderProps) => ReactNode;
  /** Layout mode */
  layout?: LayoutMode;
  /** Selection mode */
  selectionMode?: SelectionMode;
  /** Currently selected keys (controlled) */
  selectedKeys?: Set<string>;
  /** Default selected keys (uncontrolled) */
  defaultSelectedKeys?: Set<string>;
  /** Callback when selection changes */
  onSelectionChange?: (keys: Set<string>) => void;
  /** Callback when an item is clicked */
  onItemClick?: (item: T, index: number) => void;
  /** Sizing mode for items */
  sizing?: SizingMode;
  /** Number of columns for grid layout */
  columns?: number;
  /** Responsive columns based on container width (for grid layout) */
  responsiveColumns?: ResponsiveColumns;
  /** Fixed item width for auto-calculating columns */
  autoColumnsItemWidth?: number;
  /** Gap between items in pixels */
  gap?: number;
  /** Animation mode for items */
  animationMode?: AnimationMode;
  /** Custom animation variants (when animationMode is 'custom') */
  customAnimationVariants?: Variants;
  /** Overscan count for virtualization */
  overscan?: number;
  /** Additional class name for the container */
  className?: string;
  /** Additional class name for the viewport */
  viewportClassName?: string;
  /** Additional class name for the content wrapper */
  contentClassName?: string;
  /** Accessible label for the list */
  'aria-label'?: string;
} & Omit<ComponentProps<typeof BaseScrollArea.Root>, 'children' | 'ref'>;

type VirtualizedListHandle = {
  scrollToIndex: (index: number, options?: { align?: 'start' | 'center' | 'end' }) => void;
  scrollToKey: (key: string, options?: { align?: 'start' | 'center' | 'end' }) => void;
  focusItem: (index: number) => void;
};

function VirtualizedListInner<T>(
  {
    items,
    getItemKey,
    children,
    layout = 'list',
    selectionMode = 'none',
    selectedKeys: controlledSelectedKeys,
    defaultSelectedKeys,
    onSelectionChange,
    onItemClick,
    sizing = { type: 'dynamic', estimateSize: 50 },
    columns: fixedColumns,
    responsiveColumns,
    autoColumnsItemWidth,
    gap = 8,
    animationMode = 'staggered',
    customAnimationVariants,
    overscan = 5,
    className,
    viewportClassName,
    contentClassName,
    'aria-label': ariaLabel,
    ...props
  }: VirtualizedListProps<T>,
  ref: React.Ref<VirtualizedListHandle>,
) {
  const id = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [internalSelectedKeys, setInternalSelectedKeys] = useState<Set<string>>(
    defaultSelectedKeys ?? new Set(),
  );
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);

  const selectedKeys = controlledSelectedKeys ?? internalSelectedKeys;

  // Calculate columns based on settings
  const responsiveCols = useResponsiveColumns(containerRef, responsiveColumns, fixedColumns);
  const autoCols = useAutoColumns(containerRef, autoColumnsItemWidth, gap);

  const columns = useMemo(() => {
    if (layout !== 'grid') return 1;
    if (autoColumnsItemWidth) return autoCols;
    return responsiveCols;
  }, [layout, autoColumnsItemWidth, autoCols, responsiveCols]);

  // Calculate row count for grid layout
  const rowCount = useMemo(() => {
    if (layout !== 'grid') return items.length;
    return Math.ceil(items.length / columns);
  }, [layout, items.length, columns]);

  const isHorizontal = layout === 'horizontal';

  // Virtualizer
  const virtualizer = useVirtualizer({
    count: layout === 'grid' ? rowCount : items.length,
    getScrollElement: () => scrollAreaRef.current,
    estimateSize: () => (sizing.type === 'fixed' ? sizing.itemSize : sizing.estimateSize),
    overscan,
    horizontal: isHorizontal,
    measureElement: sizing.type === 'dynamic'
      ? (element) => {
          const el = element as HTMLElement;
          return isHorizontal ? el.offsetWidth : el.offsetHeight;
        }
      : undefined,
  });

  // Mark animation as complete after initial render
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimationComplete(true);
    }, Math.min(items.length * 30, 300) + 300);
    return () => clearTimeout(timer);
  }, [items.length]);

  // Selection handlers
  const toggleSelection = useCallback(
    (key: string) => {
      const newSelection = new Set(selectedKeys);
      if (newSelection.has(key)) {
        newSelection.delete(key);
      } else {
        newSelection.add(key);
      }
      if (!controlledSelectedKeys) {
        setInternalSelectedKeys(newSelection);
      }
      onSelectionChange?.(newSelection);
    },
    [selectedKeys, controlledSelectedKeys, onSelectionChange],
  );

  const selectOnly = useCallback(
    (key: string) => {
      const newSelection = new Set([key]);
      if (!controlledSelectedKeys) {
        setInternalSelectedKeys(newSelection);
      }
      onSelectionChange?.(newSelection);
    },
    [controlledSelectedKeys, onSelectionChange],
  );

  const selectRange = useCallback(
    (startIndex: number, endIndex: number) => {
      const newSelection = new Set(selectedKeys);
      const start = Math.min(startIndex, endIndex);
      const end = Math.max(startIndex, endIndex);
      for (let i = start; i <= end; i++) {
        const item = items[i];
        if (item) {
          newSelection.add(getItemKey(item, i));
        }
      }
      if (!controlledSelectedKeys) {
        setInternalSelectedKeys(newSelection);
      }
      onSelectionChange?.(newSelection);
    },
    [selectedKeys, items, getItemKey, controlledSelectedKeys, onSelectionChange],
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (items.length === 0) return;

      let nextIndex = focusedIndex;
      const isGridLayout = layout === 'grid';

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (isGridLayout) {
            nextIndex = Math.min(focusedIndex + columns, items.length - 1);
          } else if (!isHorizontal) {
            nextIndex = Math.min(focusedIndex + 1, items.length - 1);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (isGridLayout) {
            nextIndex = Math.max(focusedIndex - columns, 0);
          } else if (!isHorizontal) {
            nextIndex = Math.max(focusedIndex - 1, 0);
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (isGridLayout || isHorizontal) {
            nextIndex = Math.min(focusedIndex + 1, items.length - 1);
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (isGridLayout || isHorizontal) {
            nextIndex = Math.max(focusedIndex - 1, 0);
          }
          break;
        case 'Home':
          e.preventDefault();
          nextIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          nextIndex = items.length - 1;
          break;
        case ' ':
        case 'Enter':
          e.preventDefault();
          if (selectionMode !== 'none' && focusedIndex >= 0) {
            const item = items[focusedIndex];
            if (item) {
              const key = getItemKey(item, focusedIndex);
              if (selectionMode === 'multiple') {
                toggleSelection(key);
              } else {
                selectOnly(key);
              }
            }
          }
          return;
        case 'a':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (selectionMode === 'multiple') {
              const allKeys = new Set(items.map((item, i) => getItemKey(item, i)));
              if (!controlledSelectedKeys) {
                setInternalSelectedKeys(allKeys);
              }
              onSelectionChange?.(allKeys);
            }
          }
          return;
        default:
          return;
      }

      if (nextIndex !== focusedIndex) {
        setFocusedIndex(nextIndex);

        // Handle shift+arrow for range selection
        if (e.shiftKey && selectionMode === 'multiple') {
          const item = items[nextIndex];
          if (item) {
            toggleSelection(getItemKey(item, nextIndex));
          }
        }

        // Scroll to the focused item
        if (layout === 'grid') {
          const rowIndex = Math.floor(nextIndex / columns);
          virtualizer.scrollToIndex(rowIndex, { align: 'auto' });
        } else {
          virtualizer.scrollToIndex(nextIndex, { align: 'auto' });
        }

        // Focus the element
        const element = scrollAreaRef.current?.querySelector(`[data-index="${nextIndex}"]`) as HTMLElement;
        element?.focus();
      }
    },
    [
      items,
      focusedIndex,
      layout,
      columns,
      isHorizontal,
      selectionMode,
      getItemKey,
      toggleSelection,
      selectOnly,
      controlledSelectedKeys,
      onSelectionChange,
      virtualizer,
    ],
  );

  // Imperative handle
  useImperativeHandle(ref, () => ({
    scrollToIndex: (index, options) => {
      if (layout === 'grid') {
        const rowIndex = Math.floor(index / columns);
        virtualizer.scrollToIndex(rowIndex, { align: options?.align ?? 'auto' });
      } else {
        virtualizer.scrollToIndex(index, { align: options?.align ?? 'auto' });
      }
    },
    scrollToKey: (key, options) => {
      const index = items.findIndex((item, i) => getItemKey(item, i) === key);
      if (index >= 0) {
        if (layout === 'grid') {
          const rowIndex = Math.floor(index / columns);
          virtualizer.scrollToIndex(rowIndex, { align: options?.align ?? 'auto' });
        } else {
          virtualizer.scrollToIndex(index, { align: options?.align ?? 'auto' });
        }
      }
    },
    focusItem: (index) => {
      setFocusedIndex(index);
      const element = scrollAreaRef.current?.querySelector(`[data-index="${index}"]`) as HTMLElement;
      element?.focus();
    },
  }));

  // Context value
  const contextValue = useMemo<VirtualizedListContextValue<T>>(
    () => ({
      items,
      selectedKeys,
      focusedIndex,
      layout,
      selectionMode,
      getItemKey,
      onSelectionChange,
      onItemClick,
      setFocusedIndex,
      toggleSelection,
      selectOnly,
      selectRange,
      isAnimationComplete,
      animationMode,
    }),
    [
      items,
      selectedKeys,
      focusedIndex,
      layout,
      selectionMode,
      getItemKey,
      onSelectionChange,
      onItemClick,
      toggleSelection,
      selectOnly,
      selectRange,
      isAnimationComplete,
      animationMode,
    ],
  );

  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  const renderContent = () => {
    if (layout === 'grid') {
      return (
        <div
          style={{
            height: `${totalSize}px`,
            width: '100%',
            position: 'relative',
          }}
          className={contentClassName}
        >
          <AnimatePresence mode="popLayout">
            {virtualItems.map((virtualRow) => {
              const rowItems: Array<{ item: T; index: number; columnIndex: number }> = [];
              for (let col = 0; col < columns; col++) {
                const itemIndex = virtualRow.index * columns + col;
                const item = items[itemIndex];
                if (item !== undefined) {
                  rowItems.push({ item, index: itemIndex, columnIndex: col });
                }
              }
              return rowItems.map(({ item, index, columnIndex }) => (
                <VirtualizedGridItem
                  key={getItemKey(item, index)}
                  item={item}
                  index={index}
                  virtualRow={virtualRow}
                  columnIndex={columnIndex}
                  columns={columns}
                  gap={gap}
                  customVariants={customAnimationVariants}
                  ref={sizing.type === 'dynamic' ? virtualizer.measureElement : undefined}
                >
                  {children}
                </VirtualizedGridItem>
              ));
            })}
          </AnimatePresence>
        </div>
      );
    }

    // List or Horizontal layout
    return (
      <div
        style={{
          [isHorizontal ? 'width' : 'height']: `${totalSize}px`,
          [isHorizontal ? 'height' : 'width']: '100%',
          position: 'relative',
        }}
        className={contentClassName}
      >
        <AnimatePresence mode="popLayout">
          {virtualItems.map((virtualItem) => {
            const item = items[virtualItem.index];
            if (!item) return null;
            return (
              <VirtualizedItem
                key={getItemKey(item, virtualItem.index)}
                item={item}
                index={virtualItem.index}
                virtualItem={virtualItem}
                isHorizontal={isHorizontal}
                customVariants={customAnimationVariants}
                ref={sizing.type === 'dynamic' ? virtualizer.measureElement : undefined}
              >
                {children}
              </VirtualizedItem>
            );
          })}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <VirtualizedListContext.Provider value={contextValue as VirtualizedListContextValue<unknown>}>
      <BaseScrollArea.Root
        ref={containerRef}
        className={cn(containerVariants({ layout }), className)}
        {...props}
      >
        <BaseScrollArea.Viewport
          ref={scrollAreaRef}
          className={cn(
            'min-h-0 flex-1 overscroll-contain',
            isHorizontal ? 'overflow-x-auto' : 'overflow-y-auto',
            viewportClassName,
          )}
          onKeyDown={handleKeyDown}
          role={selectionMode !== 'none' ? 'listbox' : 'list'}
          aria-label={ariaLabel}
          aria-multiselectable={selectionMode === 'multiple'}
          tabIndex={0}
          id={id}
        >
          <BaseScrollArea.Content>
            {renderContent()}
          </BaseScrollArea.Content>
        </BaseScrollArea.Viewport>

        {!isHorizontal && (
          <BaseScrollArea.Scrollbar
            orientation="vertical"
            className={verticalScrollbarClasses}
          >
            <BaseScrollArea.Thumb className={cn(thumbClasses, 'w-full')} />
          </BaseScrollArea.Scrollbar>
        )}

        {isHorizontal && (
          <BaseScrollArea.Scrollbar
            orientation="horizontal"
            className={horizontalScrollbarClasses}
          >
            <BaseScrollArea.Thumb className={cn(thumbClasses, 'h-full')} />
          </BaseScrollArea.Scrollbar>
        )}
      </BaseScrollArea.Root>
    </VirtualizedListContext.Provider>
  );
}

const VirtualizedList = forwardRef(VirtualizedListInner) as <T>(
  props: VirtualizedListProps<T> & { ref?: React.Ref<VirtualizedListHandle> },
) => ReactNode;

// ============================================================================
// Exports
// ============================================================================

export {
  VirtualizedList,
  type VirtualizedListProps,
  type VirtualizedListHandle,
  type VirtualizedItemRenderProps,
  type LayoutMode,
  type SelectionMode,
  type ResponsiveColumns,
  type SizingMode,
  type AnimationMode,
  itemVariants,
  containerVariants,
};
