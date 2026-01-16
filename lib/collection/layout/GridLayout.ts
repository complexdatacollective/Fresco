import { type Key } from 'react-aria-components';
import { GridKeyboardDelegate } from '../keyboard/GridKeyboardDelegate';
import { type KeyboardDelegate } from '../keyboard/types';
import { type Collection } from '../types';
import { Layout } from './Layout';
import {
  type LayoutInfo,
  type LayoutOptions,
  type MeasurementInfo,
  type RowInfo,
  type Size,
} from './types';

export type GridLayoutOptions = {
  /** Minimum width for items. Columns are calculated to fit items of at least this width. Default: 200 */
  minItemWidth?: number;
  /** Gap between items. Default: 16 */
  gap?: number;
};

export class GridLayout<T = unknown> extends Layout<T> {
  private minItemWidth: number;
  private gap_: number;
  private currentColumnCount = 1;
  private currentItemWidth = 0;
  private measuredHeights = new Map<Key, number>();
  private rows: RowInfo[] = [];

  constructor(options?: GridLayoutOptions) {
    super();
    this.minItemWidth = options?.minItemWidth ?? 200;
    this.gap_ = options?.gap ?? 16;
  }

  override getGap(): number {
    return this.gap_;
  }

  getContainerStyles(): React.CSSProperties {
    return {
      display: 'grid',
      gridTemplateColumns: `repeat(auto-fill, minmax(${this.minItemWidth}px, 1fr))`,
      gap: this.gap_,
    };
  }

  getMeasurementInfo(): MeasurementInfo {
    return {
      mode: 'height-only',
      constrainedWidth: this.currentItemWidth,
    };
  }

  updateWithMeasurements(measurements: Map<Key, Size | number>): void {
    // Store measured heights
    this.measuredHeights.clear();
    for (const [key, measurement] of measurements) {
      const height =
        typeof measurement === 'number' ? measurement : measurement.height;
      this.measuredHeights.set(key, height);
    }

    // Recalculate layout with measured heights
    this.recalculateWithMeasurements();
  }

  getRows(): RowInfo[] {
    return this.rows;
  }

  /** Get the current calculated item width (for measurement) */
  getItemWidth(): number {
    return this.currentItemWidth;
  }

  update(layoutOptions: LayoutOptions): void {
    this.layoutInfos.clear();
    this.rows = [];

    const containerWidth = layoutOptions.containerWidth;
    const columnCount = this.calculateColumnCount(containerWidth);
    this.currentColumnCount = columnCount;

    if (columnCount === 0) {
      this.contentSize = { width: containerWidth, height: 0 };
      return;
    }

    const itemWidth = this.calculateItemWidth(containerWidth, columnCount);
    this.currentItemWidth = itemWidth;

    // Initial layout pass - heights will be 0 until measurements arrive
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
        y += this.gap_;
        columnIndex = 0;
      } else {
        x += itemWidth + this.gap_;
      }
    }

    this.contentSize = {
      width: containerWidth,
      height: y,
    };

    // If we already have measurements, recalculate with them
    if (this.measuredHeights.size > 0) {
      this.recalculateWithMeasurements();
    }
  }

  private recalculateWithMeasurements(): void {
    if (this.currentColumnCount === 0) return;

    const itemWidth = this.currentItemWidth;
    this.rows = [];

    let x = 0;
    let y = 0;
    let columnIndex = 0;
    let currentRowKeys: Key[] = [];
    let currentRowMaxHeight = 0;
    let rowIndex = 0;

    for (const key of this.orderedKeys) {
      const node = this.items.get(key);
      if (!node) continue;

      const height = this.measuredHeights.get(key) ?? 0;

      // Track max height for this row
      currentRowMaxHeight = Math.max(currentRowMaxHeight, height);
      currentRowKeys.push(key);

      const layoutInfo: LayoutInfo = {
        key,
        rect: { x, y, width: itemWidth, height },
      };

      this.layoutInfos.set(key, layoutInfo);

      columnIndex++;

      if (columnIndex >= this.currentColumnCount) {
        // Complete the current row
        this.rows.push({
          rowIndex,
          yStart: y,
          height: currentRowMaxHeight,
          itemKeys: currentRowKeys,
        });

        // Move to next row
        x = 0;
        y += currentRowMaxHeight + this.gap_;
        columnIndex = 0;
        currentRowKeys = [];
        currentRowMaxHeight = 0;
        rowIndex++;
      } else {
        x += itemWidth + this.gap_;
      }
    }

    // Don't forget the last partial row
    if (currentRowKeys.length > 0) {
      this.rows.push({
        rowIndex,
        yStart: y,
        height: currentRowMaxHeight,
        itemKeys: currentRowKeys,
      });
      y += currentRowMaxHeight;
    }

    this.contentSize = {
      width: this.contentSize.width,
      height: y,
    };
  }

  private calculateColumnCount(containerWidth: number): number {
    const availableWidth = containerWidth + this.gap_;
    const itemWidthWithGap = this.minItemWidth + this.gap_;
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
    const totalGapWidth = this.gap_ * (columnCount - 1);
    const availableWidth = containerWidth - totalGapWidth;
    return availableWidth / columnCount;
  }

  getKeyboardDelegate(
    collection: Collection<unknown>,
    disabledKeys: Set<Key>,
    containerWidth?: number,
  ): KeyboardDelegate {
    // Calculate column count from container width if provided, otherwise use current
    const columnCount =
      containerWidth !== undefined
        ? this.calculateColumnCount(containerWidth)
        : this.currentColumnCount;

    return new GridKeyboardDelegate(collection, columnCount, disabledKeys);
  }
}
