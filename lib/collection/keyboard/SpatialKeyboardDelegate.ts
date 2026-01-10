import { type Collection, type Key } from '../types';
import { type Rect } from '../layout/types';
import { type KeyboardDelegate } from './types';

type GetItemRect = (key: Key) => Rect | null;

/**
 * Keyboard delegate that uses spatial positions of items for navigation.
 * This is ideal for layouts where items have variable sizes or positions,
 * like flexbox grids with different item widths.
 *
 * Navigation logic:
 * - Up/Down: Find the item in the adjacent row that's closest to the current item's horizontal center
 * - Left/Right: Find the nearest item in the same visual row
 */
export class SpatialKeyboardDelegate implements KeyboardDelegate {
  private collection: Collection<unknown>;
  private disabledKeys: Set<Key>;
  private getItemRect: GetItemRect;

  constructor(
    collection: Collection<unknown>,
    getItemRect: GetItemRect,
    disabledKeys = new Set<Key>(),
  ) {
    this.collection = collection;
    this.getItemRect = getItemRect;
    this.disabledKeys = disabledKeys;
  }

  private getKeys(): Key[] {
    return Array.from(this.collection.getKeys());
  }

  private getCenterX(rect: Rect): number {
    return rect.x + rect.width / 2;
  }

  private getCenterY(rect: Rect): number {
    return rect.y + rect.height / 2;
  }

  private isOnSameRow(rect1: Rect, rect2: Rect): boolean {
    // Items are on the same row if their vertical ranges overlap significantly
    const top1 = rect1.y;
    const bottom1 = rect1.y + rect1.height;
    const top2 = rect2.y;
    const bottom2 = rect2.y + rect2.height;

    // Check if there's significant vertical overlap (more than 50% of the smaller item)
    const overlapTop = Math.max(top1, top2);
    const overlapBottom = Math.min(bottom1, bottom2);
    const overlapHeight = Math.max(0, overlapBottom - overlapTop);

    const minHeight = Math.min(rect1.height, rect2.height);
    return minHeight > 0 && overlapHeight > minHeight * 0.5;
  }

  private skipDisabled(key: Key | null): Key | null {
    if (key === null) return null;
    if (!this.disabledKeys.has(key)) return key;

    // If the target is disabled, try to find nearest non-disabled item
    // For simplicity, we return null and let the caller handle it
    return null;
  }

  private findNearestInDirection(
    fromKey: Key,
    direction: 'up' | 'down' | 'left' | 'right',
  ): Key | null {
    const fromRect = this.getItemRect(fromKey);
    if (!fromRect) return null;

    const fromCenterX = this.getCenterX(fromRect);
    const fromCenterY = this.getCenterY(fromRect);

    const keys = this.getKeys();
    let bestKey: Key | null = null;
    let bestDistance = Infinity;

    for (const key of keys) {
      if (key === fromKey) continue;
      if (this.disabledKeys.has(key)) continue;

      const rect = this.getItemRect(key);
      if (!rect) continue;

      const centerX = this.getCenterX(rect);
      const centerY = this.getCenterY(rect);

      let isValidCandidate = false;
      let primaryDistance: number;
      let secondaryDistance: number;

      switch (direction) {
        case 'down':
          // Item must be below (center Y is greater)
          if (centerY > fromCenterY) {
            isValidCandidate = true;
            // Primary: vertical distance, Secondary: horizontal distance
            primaryDistance = centerY - fromCenterY;
            secondaryDistance = Math.abs(centerX - fromCenterX);
          }
          break;

        case 'up':
          // Item must be above (center Y is smaller)
          if (centerY < fromCenterY) {
            isValidCandidate = true;
            primaryDistance = fromCenterY - centerY;
            secondaryDistance = Math.abs(centerX - fromCenterX);
          }
          break;

        case 'right':
          // Item must be to the right and on the same row
          if (centerX > fromCenterX && this.isOnSameRow(fromRect, rect)) {
            isValidCandidate = true;
            primaryDistance = centerX - fromCenterX;
            secondaryDistance = Math.abs(centerY - fromCenterY);
          }
          break;

        case 'left':
          // Item must be to the left and on the same row
          if (centerX < fromCenterX && this.isOnSameRow(fromRect, rect)) {
            isValidCandidate = true;
            primaryDistance = fromCenterX - centerX;
            secondaryDistance = Math.abs(centerY - fromCenterY);
          }
          break;
      }

      if (isValidCandidate) {
        // For up/down, prioritize items with similar X position (same column-ish)
        // For left/right, prioritize closest item
        let distance: number;

        if (direction === 'up' || direction === 'down') {
          // Weight: prefer items closer horizontally, then vertically
          // Using a weighted distance where horizontal alignment matters more
          distance = secondaryDistance! * 1000 + primaryDistance!;
        } else {
          // For left/right, just use horizontal distance
          distance = primaryDistance!;
        }

        if (distance < bestDistance) {
          bestDistance = distance;
          bestKey = key;
        }
      }
    }

    return bestKey;
  }

  getKeyBelow(key: Key): Key | null {
    return this.findNearestInDirection(key, 'down');
  }

  getKeyAbove(key: Key): Key | null {
    return this.findNearestInDirection(key, 'up');
  }

  getKeyRightOf(key: Key): Key | null {
    return this.findNearestInDirection(key, 'right');
  }

  getKeyLeftOf(key: Key): Key | null {
    return this.findNearestInDirection(key, 'left');
  }

  getFirstKey(): Key | null {
    let firstKey = this.collection.getFirstKey();
    while (firstKey !== null && this.disabledKeys.has(firstKey)) {
      firstKey = this.collection.getKeyAfter(firstKey);
    }
    return firstKey;
  }

  getLastKey(): Key | null {
    let lastKey = this.collection.getLastKey();
    while (lastKey !== null && this.disabledKeys.has(lastKey)) {
      lastKey = this.collection.getKeyBefore(lastKey);
    }
    return lastKey;
  }

  getKeyForSearch(search: string, fromKey?: Key): Key | null {
    const searchLower = search.toLowerCase();
    const keys = this.getKeys();

    let startIndex = 0;
    if (fromKey !== undefined) {
      const fromIndex = keys.indexOf(fromKey);
      if (fromIndex !== -1) {
        startIndex = fromIndex + 1;
      }
    }

    // Search from startIndex to end
    for (let i = startIndex; i < keys.length; i++) {
      const key = keys[i];
      if (key === undefined) continue;
      if (this.disabledKeys.has(key)) continue;

      const node = this.collection.getItem(key);
      const textValue = node?.textValue?.toLowerCase();

      if (textValue?.startsWith(searchLower)) {
        return key;
      }
    }

    // Wrap around and search from beginning to startIndex
    for (let i = 0; i < startIndex; i++) {
      const key = keys[i];
      if (key === undefined) continue;
      if (this.disabledKeys.has(key)) continue;

      const node = this.collection.getItem(key);
      const textValue = node?.textValue?.toLowerCase();

      if (textValue?.startsWith(searchLower)) {
        return key;
      }
    }

    return null;
  }
}
