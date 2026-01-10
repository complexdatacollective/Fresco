import { type Key } from 'react-aria-components';
import { SpatialKeyboardDelegate } from '../keyboard/SpatialKeyboardDelegate';
import { type KeyboardDelegate } from '../keyboard/types';
import { type Collection } from '../types';
import { Layout } from './Layout';
import { type LayoutInfo, type LayoutOptions } from './types';

export type InlineGridLayoutOptions = {
  /** Width of each item in pixels (used for keyboard navigation column calculation) */
  itemWidth: number;
  /** Height of each item in pixels (used for keyboard navigation row detection) */
  itemHeight?: number;
  /** Gap between items in pixels */
  gap?: number;
};

/**
 * A flexbox-based grid layout using flex-wrap.
 * Items are laid out in rows that wrap when they exceed container width.
 * Keyboard navigation works in 2D (up/down navigates rows, left/right navigates within row).
 */
export class InlineGridLayout<T = unknown> extends Layout<T> {
  private itemWidth: number;
  private itemHeight: number;
  private gap: number;
  private currentColumnCount = 1;

  constructor(options: InlineGridLayoutOptions) {
    super();
    this.itemWidth = options.itemWidth;
    this.itemHeight = options.itemHeight ?? 50; // Default height for keyboard navigation
    this.gap = options.gap ?? 16;
  }

  getContainerStyles(): React.CSSProperties {
    return {
      display: 'flex',
      flexWrap: 'wrap',
      gap: this.gap,
    };
  }

  override getItemStyles(): React.CSSProperties {
    // Items control their own width - the itemWidth parameter is only used
    // for calculating column count for keyboard navigation
    return {};
  }

  override getGap(): number {
    return this.gap;
  }

  update(layoutOptions: LayoutOptions): void {
    this.layoutInfos.clear();

    const containerWidth = layoutOptions.containerWidth;
    const columnCount = this.calculateColumnCount(containerWidth);
    this.currentColumnCount = columnCount;

    if (columnCount === 0) {
      this.contentSize = { width: containerWidth, height: 0 };
      return;
    }

    let x = 0;
    let y = 0;
    let columnIndex = 0;

    for (const key of this.orderedKeys) {
      const node = this.items.get(key);
      if (!node) continue;

      const layoutInfo: LayoutInfo = {
        key,
        rect: { x, y, width: this.itemWidth, height: this.itemHeight },
      };

      this.layoutInfos.set(key, layoutInfo);

      columnIndex++;

      if (columnIndex >= columnCount) {
        x = 0;
        y += this.itemHeight + this.gap;
        columnIndex = 0;
      } else {
        x += this.itemWidth + this.gap;
      }
    }

    // Calculate total height including the last row
    const totalRows = Math.ceil(this.orderedKeys.length / columnCount);
    const totalHeight =
      totalRows > 0
        ? totalRows * this.itemHeight + (totalRows - 1) * this.gap
        : 0;

    this.contentSize = {
      width: containerWidth,
      height: totalHeight,
    };
  }

  private calculateColumnCount(containerWidth: number): number {
    if (containerWidth <= 0) return 1;

    const availableWidth = containerWidth + this.gap;
    const itemWidthWithGap = this.itemWidth + this.gap;
    const columnCount = Math.max(
      1,
      Math.floor(availableWidth / itemWidthWithGap),
    );

    return columnCount;
  }

  getKeyboardDelegate(
    collection: Collection<unknown>,
    disabledKeys: Set<Key>,
    containerWidth?: number,
  ): KeyboardDelegate {
    // Update layout positions if container width changed
    if (containerWidth !== undefined && containerWidth > 0) {
      this.currentColumnCount = this.calculateColumnCount(containerWidth);
    }

    // Use spatial keyboard delegate that navigates based on actual DOM positions
    // This correctly handles variable-sized items (like Node components vs Card components)
    return new SpatialKeyboardDelegate(
      collection,
      (key) => this.getItemRectFromDOM(key),
      disabledKeys,
    );
  }
}
