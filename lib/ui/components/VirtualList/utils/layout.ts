import type { GridModeConfig, ColumnModeConfig, HorizontalModeConfig } from '../types';

export const calculateGridItemsPerRow = (
  containerWidth: number,
  itemWidth: number,
  gap: number,
): number => {
  if (containerWidth === 0) return 1;
  
  // Calculate how many items can fit: container = n*itemWidth + (n-1)*gap
  // Solve for n: containerWidth = n*itemWidth + n*gap - gap
  // containerWidth + gap = n*(itemWidth + gap)
  // n = (containerWidth + gap) / (itemWidth + gap)
  const itemsPerRow = Math.floor((containerWidth + gap) / (itemWidth + gap));
  return Math.max(1, itemsPerRow);
};

export const calculateGridRowCount = (
  totalItems: number,
  itemsPerRow: number,
): number => {
  return Math.ceil(totalItems / itemsPerRow);
};

export const calculateGridItemPosition = (
  index: number,
  itemsPerRow: number,
  itemWidth: number,
  itemHeight: number,
  gap: number,
): { row: number; col: number; x: number; y: number } => {
  const row = Math.floor(index / itemsPerRow);
  const col = index % itemsPerRow;
  const x = col * (itemWidth + gap);
  const y = row * (itemHeight + gap);
  
  return { row, col, x, y };
};

export const calculateColumnItemPosition = (
  index: number,
  columns: number,
  columnWidth: number,
  itemHeight: number,
  gap: number,
): { row: number; col: number; x: number; y: number } => {
  const row = Math.floor(index / columns);
  const col = index % columns;
  const x = col * (columnWidth + gap);
  const y = row * (itemHeight + gap);
  
  return { row, col, x, y };
};

export const calculateColumnWidth = (
  containerWidth: number,
  columns: number,
  gap: number,
): number => {
  if (containerWidth === 0) return 0;
  
  // container = columns*width + (columns-1)*gap
  // width = (container - (columns-1)*gap) / columns
  return (containerWidth - (columns - 1) * gap) / columns;
};

export const getLayoutDimensions = (
  layout: GridModeConfig | ColumnModeConfig | HorizontalModeConfig,
  containerWidth: number,
  containerHeight: number,
  itemCount: number,
) => {
  switch (layout.mode) {
    case 'grid': {
      const itemsPerRow = calculateGridItemsPerRow(
        containerWidth,
        layout.itemSize.width,
        layout.gap,
      );
      const rowCount = calculateGridRowCount(itemCount, itemsPerRow);
      const totalHeight = rowCount * layout.itemSize.height + (rowCount - 1) * layout.gap;
      
      return {
        itemsPerRow,
        rowCount,
        totalHeight,
        itemWidth: layout.itemSize.width,
        itemHeight: layout.itemSize.height,
      };
    }
    
    case 'columns': {
      const columnWidth = calculateColumnWidth(containerWidth, layout.columns, layout.gap);
      const rowCount = calculateGridRowCount(itemCount, layout.columns);
      const totalHeight = rowCount * layout.itemHeight + (rowCount - 1) * layout.gap;
      
      return {
        itemsPerRow: layout.columns,
        rowCount,
        totalHeight,
        itemWidth: columnWidth,
        itemHeight: layout.itemHeight,
      };
    }
    
    case 'horizontal': {
      const totalWidth = itemCount * layout.itemWidth + (itemCount - 1) * layout.gap;
      
      return {
        itemsPerRow: itemCount, // All items in one row
        rowCount: 1,
        totalWidth,
        itemWidth: layout.itemWidth,
        itemHeight: layout.itemHeight,
      };
    }
  }
};