import { type Key } from 'react-aria-components';
import { type KeyboardDelegate } from '../keyboard/types';
import { type Collection, type Node } from '../types';
import {
  type LayoutInfo,
  type LayoutOptions,
  type Padding,
  type Rect,
  type Size,
} from './types';

export abstract class Layout<T = unknown> {
  protected items = new Map<Key, Node<T>>();
  protected orderedKeys: Key[] = [];
  protected contentSize: Size = { width: 0, height: 0 };
  protected layoutInfos = new Map<Key, LayoutInfo>();

  abstract update(options: LayoutOptions): void;

  abstract getContainerStyles(): React.CSSProperties;

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
