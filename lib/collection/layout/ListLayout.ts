import { type Key } from 'react-aria-components';
import { ListKeyboardDelegate } from '../keyboard/ListKeyboardDelegate';
import { type KeyboardDelegate } from '../keyboard/types';
import { type Collection } from '../types';
import { Layout } from './Layout';
import { type LayoutInfo, type LayoutOptions } from './types';

export type ListLayoutOptions = {
  gap?: number;
};

export class ListLayout<T = unknown> extends Layout<T> {
  private gap: number;

  constructor(options?: ListLayoutOptions) {
    super();
    this.gap = options?.gap ?? 0;
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

  update(layoutOptions: LayoutOptions): void {
    this.layoutInfos.clear();

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

      y += this.gap;
    }

    this.contentSize = {
      width: layoutOptions.containerWidth,
      height: Math.max(0, y - this.gap),
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
