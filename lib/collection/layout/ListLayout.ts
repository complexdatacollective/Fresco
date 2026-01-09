import { type Key } from 'react-aria-components';
import { ListKeyboardDelegate } from '../keyboard/ListKeyboardDelegate';
import { type KeyboardDelegate } from '../keyboard/types';
import { type Collection } from '../types';
import { Layout } from './Layout';
import { type LayoutInfo, type LayoutOptions, type Padding } from './types';

export type ListLayoutOptions = {
  gap?: number;
  padding?: number | Padding;
};

export class ListLayout<T = unknown> extends Layout<T> {
  private gap: number;
  private padding: Padding;

  constructor(options?: ListLayoutOptions) {
    super();
    this.gap = options?.gap ?? 0;
    this.padding = this.normalizePadding(options?.padding);
  }

  private normalizePadding(padding?: number | Padding): Padding {
    if (padding === undefined) {
      return { top: 0, right: 0, bottom: 0, left: 0 };
    }
    if (typeof padding === 'number') {
      return { top: padding, right: padding, bottom: padding, left: padding };
    }
    return padding;
  }

  getContainerStyles(): React.CSSProperties {
    return {
      display: 'flex',
      flexDirection: 'column',
      gap: this.gap,
    };
  }

  override getGap(): number {
    return this.gap;
  }

  override getPadding(): Padding {
    return this.padding;
  }

  update(layoutOptions: LayoutOptions): void {
    this.layoutInfos.clear();

    let y = this.padding.top;
    const width =
      layoutOptions.containerWidth - this.padding.left - this.padding.right;

    for (const key of this.orderedKeys) {
      const node = this.items.get(key);
      if (!node) continue;

      const layoutInfo: LayoutInfo = {
        key,
        rect: { x: this.padding.left, y, width, height: 0 },
      };

      this.layoutInfos.set(key, layoutInfo);

      y += this.gap;
    }

    this.contentSize = {
      width: layoutOptions.containerWidth,
      height: Math.max(0, y - this.gap + this.padding.bottom),
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
