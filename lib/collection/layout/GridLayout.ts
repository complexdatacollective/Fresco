import { Layout } from './Layout';
import { type LayoutInfo, type LayoutOptions } from './types';

export type GridLayoutOptions = {
  minItemWidth?: number;
  maxItemWidth?: number;
  gap?: number;
  columns?: number | 'auto';
};

export class GridLayout<T = unknown> extends Layout<T> {
  private minItemWidth: number;
  private maxItemWidth?: number;
  private gap: number;
  private columns: number | 'auto';

  constructor(options?: GridLayoutOptions) {
    super();
    this.minItemWidth = options?.minItemWidth ?? 200;
    this.maxItemWidth = options?.maxItemWidth;
    this.gap = options?.gap ?? 16;
    this.columns = options?.columns ?? 'auto';
  }

  getContainerStyles(): React.CSSProperties {
    return {
      display: 'grid',
      gridTemplateColumns:
        this.columns === 'auto'
          ? `repeat(auto-fill, minmax(${this.minItemWidth}px, 1fr))`
          : `repeat(${this.columns}, 1fr)`,
      gap: this.gap,
    };
  }

  update(layoutOptions: LayoutOptions): void {
    this.layoutInfos.clear();

    const containerWidth = layoutOptions.containerWidth;
    const columnCount = this.calculateColumnCount(containerWidth);

    if (columnCount === 0) {
      this.contentSize = { width: containerWidth, height: 0 };
      return;
    }

    const itemWidth = this.calculateItemWidth(containerWidth, columnCount);

    let x = 0;
    let y = 0;
    let columnIndex = 0;

    for (const key of this.orderedKeys) {
      const node = this.items.get(key);
      if (!node) continue;

      const layoutInfo: LayoutInfo = {
        key,
        rect: { x, y, width: itemWidth, height: 0 },
      };

      this.layoutInfos.set(key, layoutInfo);

      columnIndex++;

      if (columnIndex >= columnCount) {
        x = 0;
        y += this.gap;
        columnIndex = 0;
      } else {
        x += itemWidth + this.gap;
      }
    }

    this.contentSize = {
      width: containerWidth,
      height: y,
    };
  }

  private calculateColumnCount(containerWidth: number): number {
    if (this.columns !== 'auto') {
      return this.columns;
    }

    const availableWidth = containerWidth + this.gap;
    const itemWidthWithGap = this.minItemWidth + this.gap;
    const columnCount = Math.max(
      1,
      Math.floor(availableWidth / itemWidthWithGap),
    );

    return columnCount;
  }

  private calculateItemWidth(
    containerWidth: number,
    columnCount: number,
  ): number {
    const totalGapWidth = this.gap * (columnCount - 1);
    const availableWidth = containerWidth - totalGapWidth;
    let itemWidth = availableWidth / columnCount;

    if (this.maxItemWidth !== undefined) {
      itemWidth = Math.min(itemWidth, this.maxItemWidth);
    }

    return itemWidth;
  }
}
