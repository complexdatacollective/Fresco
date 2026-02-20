import { type RefObject } from 'react';
import { type Key } from 'react-aria-components';
import { type KeyboardDelegate } from '../keyboard/types';
import { type Collection, type Node } from '../types';
import {
  type LayoutInfo,
  type LayoutOptions,
  type MeasurementInfo,
  type Padding,
  type Rect,
  type RowInfo,
  type Size,
} from './types';

export abstract class Layout<T = unknown> {
  protected items = new Map<Key, Node<T>>();
  protected orderedKeys: Key[] = [];
  protected contentSize: Size = { width: 0, height: 0 };
  protected layoutInfos = new Map<Key, LayoutInfo>();
  protected containerRef: RefObject<HTMLElement | null> | null = null;
  protected collectionId = 'collection';
  protected itemRefs = new Map<Key, HTMLElement>();

  abstract update(options: LayoutOptions): void;

  abstract getContainerStyles(): React.CSSProperties;

  /**
   * Returns measurement requirements for virtualization.
   * - 'none': No measurement needed (fixed sizes)
   * - 'height-only': Measure height with constrained width
   * - 'intrinsic': Measure full intrinsic size
   *
   * @param containerWidth - Optional container width for computing constrainedWidth
   *   on-the-fly, without requiring update() to have been called first. This avoids
   *   timing issues where measurement starts before the layout has been initialized.
   */
  abstract getMeasurementInfo(containerWidth?: number): MeasurementInfo;

  /**
   * Updates layout with measured item dimensions.
   * For 'height-only' mode: measurements contain heights only.
   * For 'intrinsic' mode: measurements contain full Size objects.
   */
  abstract updateWithMeasurements(measurements: Map<Key, Size | number>): void;

  /**
   * Returns items grouped into rows for virtualization.
   * Each row contains items that share the same Y position.
   * For list layouts, each item is its own row.
   */
  abstract getRows(): RowInfo[];

  getItemStyles(): React.CSSProperties {
    return {};
  }

  getContentSize(): Size {
    return this.contentSize;
  }

  getGap(): number {
    return 0;
  }

  getPadding(): Padding {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  getLayoutInfo(key: Key): LayoutInfo | null {
    return this.layoutInfos.get(key) ?? null;
  }

  getVisibleLayoutInfos(rect: Rect): LayoutInfo[] {
    const visible: LayoutInfo[] = [];

    for (const info of this.layoutInfos.values()) {
      if (this.intersects(rect, info.rect)) {
        visible.push(info);
      }
    }

    return visible;
  }

  getItemRect(key: Key): Rect | null {
    return this.getLayoutInfo(key)?.rect ?? null;
  }

  setItems(items: Map<Key, Node<T>>, orderedKeys: Key[]): void {
    this.items = items;
    this.orderedKeys = orderedKeys;
  }

  /**
   * Sets the container ref for DOM-based position queries.
   * Some layouts (like InlineGridLayout) use actual DOM positions
   * rather than calculated positions for keyboard navigation.
   */
  setContainerRef(
    ref: RefObject<HTMLElement | null>,
    collectionId: string,
  ): void {
    this.containerRef = ref;
    this.collectionId = collectionId;
  }

  /**
   * Registers an item's DOM element for position queries.
   * Called by items when they mount/update.
   */
  registerItemRef(key: Key, element: HTMLElement | null): void {
    if (element) {
      this.itemRefs.set(key, element);
    } else {
      this.itemRefs.delete(key);
    }
  }

  /**
   * Gets the bounding rect of an item from its registered ref.
   * Returns positions relative to the container.
   * Falls back to calculated layoutInfo if ref is not available.
   */
  protected getItemRectFromDOM(key: Key): Rect | null {
    const container = this.containerRef?.current;
    const itemElement = this.itemRefs.get(key);

    if (!container || !itemElement) {
      return this.getItemRect(key);
    }

    const containerRect = container.getBoundingClientRect();
    const itemRect = itemElement.getBoundingClientRect();

    // Return position relative to container
    return {
      x: itemRect.left - containerRect.left,
      y: itemRect.top - containerRect.top,
      width: itemRect.width,
      height: itemRect.height,
    };
  }

  private intersects(a: Rect, b: Rect): boolean {
    return !(
      a.x + a.width < b.x ||
      b.x + b.width < a.x ||
      a.y + a.height < b.y ||
      b.y + b.height < a.y
    );
  }

  /**
   * Creates a keyboard delegate appropriate for this layout type.
   * Override in subclasses to provide layout-specific navigation.
   *
   * @param collection - The collection of items
   * @param disabledKeys - Set of disabled item keys
   * @param containerWidth - Optional container width for calculating grid columns
   */
  abstract getKeyboardDelegate(
    collection: Collection<unknown>,
    disabledKeys: Set<Key>,
    containerWidth?: number,
  ): KeyboardDelegate;
}
