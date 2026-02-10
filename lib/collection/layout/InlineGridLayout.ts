import { type Key } from 'react-aria-components';
import { SpatialKeyboardDelegate } from '../keyboard/SpatialKeyboardDelegate';
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

type InlineGridLayoutOptions = {
  /** Gap between items in pixels. Default: 16 */
  gap?: number;
};

/**
 * A flexbox-based grid layout using flex-wrap.
 * Items are laid out in rows that wrap when they exceed container width.
 * Keyboard navigation works in 2D (up/down navigates rows, left/right navigates within row).
 *
 * Unlike GridLayout, items maintain their intrinsic sizes. Use this when items
 * have varying widths (like tags or badges) that should not be constrained.
 *
 * For virtualization, items are measured in a hidden container to determine their
 * intrinsic sizes before calculating positions.
 */
export class InlineGridLayout<T = unknown> extends Layout<T> {
  private gap_: number;
  private containerWidth = 0;
  private measuredSizes = new Map<Key, Size>();
  private rows: RowInfo[] = [];

  constructor(options?: InlineGridLayoutOptions) {
    super();
    this.gap_ = options?.gap ?? 16;
  }

  getContainerStyles(): React.CSSProperties {
    return {
      display: 'flex',
      flexWrap: 'wrap',
      gap: this.gap_,
    };
  }

  override getItemStyles(): React.CSSProperties {
    // Items control their own size - no constraints
    return {};
  }

  override getGap(): number {
    return this.gap_;
  }

  getMeasurementInfo(): MeasurementInfo {
    return {
      mode: 'intrinsic',
    };
  }

  updateWithMeasurements(measurements: Map<Key, Size | number>): void {
    // Store measured sizes (full width and height)
    this.measuredSizes.clear();
    for (const [key, measurement] of measurements) {
      if (typeof measurement === 'number') {
        // For height-only measurements, use container width as default
        this.measuredSizes.set(key, {
          width: this.containerWidth,
          height: measurement,
        });
      } else {
        // Validate that items have explicit dimensions
        if (measurement.width === 0 || measurement.height === 0) {
          throw new Error(
            `InlineGridLayout: Item "${String(key)}" measured to ${measurement.width}x${measurement.height}. ` +
              `Items must have explicit width and height, or content that defines their size.`,
          );
        }
        this.measuredSizes.set(key, measurement);
      }
    }

    // Recalculate layout with measured sizes
    this.recalculateWithMeasurements();
  }

  getRows(): RowInfo[] {
    return this.rows;
  }

  update(layoutOptions: LayoutOptions): void {
    this.layoutInfos.clear();
    this.rows = [];
    this.containerWidth = layoutOptions.containerWidth;

    // Initial pass without measurements - positions will be approximate
    // until measurements arrive
    let x = 0;
    let y = 0;

    for (const key of this.orderedKeys) {
      const node = this.items.get(key);
      if (!node) continue;

      // Use measured size if available, otherwise use placeholder
      const size = this.measuredSizes.get(key) ?? { width: 100, height: 50 };

      const layoutInfo: LayoutInfo = {
        key,
        rect: { x, y, width: size.width, height: size.height },
      };

      this.layoutInfos.set(key, layoutInfo);

      // Move to next position
      x += size.width + this.gap_;

      // Wrap to next row if needed
      if (x > this.containerWidth && x > size.width + this.gap_) {
        x = 0;
        y += size.height + this.gap_;
      }
    }

    this.contentSize = {
      width: this.containerWidth,
      height: y + 50, // Approximate until measurements
    };

    // If we already have measurements, recalculate with them
    if (this.measuredSizes.size > 0) {
      this.recalculateWithMeasurements();
    }
  }

  private recalculateWithMeasurements(): void {
    this.layoutInfos.clear();
    this.rows = [];

    let x = 0;
    let y = 0;
    let currentRowKeys: Key[] = [];
    let currentRowMaxHeight = 0;
    let rowIndex = 0;

    for (const key of this.orderedKeys) {
      const node = this.items.get(key);
      if (!node) continue;

      const size = this.measuredSizes.get(key);
      if (!size) continue;

      // Check if this item would overflow the row
      if (x > 0 && x + size.width > this.containerWidth) {
        // Complete the current row before starting a new one
        if (currentRowKeys.length > 0) {
          this.rows.push({
            rowIndex,
            yStart: y,
            height: currentRowMaxHeight,
            itemKeys: currentRowKeys,
          });
          rowIndex++;
        }

        // Start new row
        x = 0;
        y += currentRowMaxHeight + this.gap_;
        currentRowKeys = [];
        currentRowMaxHeight = 0;
      }

      // Add item to current row
      const layoutInfo: LayoutInfo = {
        key,
        rect: { x, y, width: size.width, height: size.height },
      };

      this.layoutInfos.set(key, layoutInfo);
      currentRowKeys.push(key);
      currentRowMaxHeight = Math.max(currentRowMaxHeight, size.height);

      // Move to next position
      x += size.width + this.gap_;
    }

    // Don't forget the last row
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
      width: this.containerWidth,
      height: y,
    };
  }

  getKeyboardDelegate(
    collection: Collection<unknown>,
    disabledKeys: Set<Key>,
    _containerWidth?: number,
  ): KeyboardDelegate {
    // Use spatial keyboard delegate that navigates based on actual DOM positions
    // This correctly handles variable-sized items (like Node components vs Card components)
    return new SpatialKeyboardDelegate(
      collection,
      (key) => this.getItemRectFromDOM(key),
      disabledKeys,
    );
  }
}
