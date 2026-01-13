import { type Key } from 'react-aria-components';
import { ListKeyboardDelegate } from '../keyboard/ListKeyboardDelegate';
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

export type ListLayoutOptions = {
  gap?: number;
};

export class ListLayout<T = unknown> extends Layout<T> {
  private gap_: number;
  private containerWidth = 0;
  private measuredHeights = new Map<Key, number>();
  private rows: RowInfo[] = [];

  constructor(options?: ListLayoutOptions) {
    super();
    this.gap_ = options?.gap ?? 0;
  }

  getContainerStyles(): React.CSSProperties {
    return {
      display: 'flex',
      flexDirection: 'column',
      gap: this.gap_,
    };
  }

  override getGap(): number {
    return this.gap_;
  }

  getMeasurementInfo(): MeasurementInfo {
    return {
      mode: 'height-only',
      constrainedWidth: this.containerWidth,
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

  update(layoutOptions: LayoutOptions): void {
    this.layoutInfos.clear();
    this.rows = [];
    this.containerWidth = layoutOptions.containerWidth;

    let y = 0;
    const width = layoutOptions.containerWidth;

    for (const key of this.orderedKeys) {
      const node = this.items.get(key);
      if (!node) continue;

      const layoutInfo: LayoutInfo = {
        key,
        rect: { x: 0, y, width, height: 0 },
      };

      this.layoutInfos.set(key, layoutInfo);

      y += this.gap_;
    }

    this.contentSize = {
      width: layoutOptions.containerWidth,
      height: Math.max(0, y - this.gap_),
    };

    // If we already have measurements, recalculate with them
    if (this.measuredHeights.size > 0) {
      this.recalculateWithMeasurements();
    }
  }

  private recalculateWithMeasurements(): void {
    this.rows = [];

    let y = 0;
    let rowIndex = 0;

    for (const key of this.orderedKeys) {
      const node = this.items.get(key);
      if (!node) continue;

      const height = this.measuredHeights.get(key) ?? 0;

      const layoutInfo: LayoutInfo = {
        key,
        rect: { x: 0, y, width: this.containerWidth, height },
      };

      this.layoutInfos.set(key, layoutInfo);

      // Each item is its own row in a list layout
      this.rows.push({
        rowIndex,
        yStart: y,
        height,
        itemKeys: [key],
      });

      y += height + this.gap_;
      rowIndex++;
    }

    // Remove the last gap from content height
    this.contentSize = {
      width: this.containerWidth,
      height: Math.max(0, y - this.gap_),
    };
  }

  getKeyboardDelegate(
    collection: Collection<unknown>,
    disabledKeys: Set<Key>,
    _containerWidth?: number,
  ): KeyboardDelegate {
    return new ListKeyboardDelegate(collection, disabledKeys);
  }
}
