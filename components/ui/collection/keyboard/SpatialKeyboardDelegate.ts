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

  private findNearestVertical(
    fromKey: Key,
    direction: 'up' | 'down',
  ): Key | null {
    const fromRect = this.getItemRect(fromKey);
    if (!fromRect) return null;

    const fromCenterX = this.getCenterX(fromRect);
    const fromCenterY = this.getCenterY(fromRect);

    // Collect candidates: items in the target direction and NOT on the same row
    type Candidate = { key: Key; rect: Rect; centerX: number; centerY: number };
    const candidates: Candidate[] = [];

    for (const key of this.getKeys()) {
      if (key === fromKey || this.disabledKeys.has(key)) continue;

      const rect = this.getItemRect(key);
      if (!rect) continue;

      const centerY = this.getCenterY(rect);
      const isInDirection =
        direction === 'down' ? centerY > fromCenterY : centerY < fromCenterY;

      if (isInDirection && !this.isOnSameRow(fromRect, rect)) {
        candidates.push({
          key,
          rect,
          centerX: this.getCenterX(rect),
          centerY,
        });
      }
    }

    if (candidates.length === 0) return null;

    // Find the nearest row by vertical distance
    let nearestCandidate = candidates[0]!;
    let nearestVertDist = Math.abs(nearestCandidate.centerY - fromCenterY);

    for (const c of candidates) {
      const vertDist = Math.abs(c.centerY - fromCenterY);
      if (vertDist < nearestVertDist) {
        nearestCandidate = c;
        nearestVertDist = vertDist;
      }
    }

    // Get all candidates on the same row as the nearest
    const nearestRowCandidates = candidates.filter((c) =>
      this.isOnSameRow(nearestCandidate.rect, c.rect),
    );

    // Pick the one closest horizontally
    let bestKey = nearestRowCandidates[0]!.key;
    let bestHorizDist = Math.abs(
      nearestRowCandidates[0]!.centerX - fromCenterX,
    );

    for (const c of nearestRowCandidates) {
      const horizDist = Math.abs(c.centerX - fromCenterX);
      if (horizDist < bestHorizDist) {
        bestKey = c.key;
        bestHorizDist = horizDist;
      }
    }

    return bestKey;
  }

  private findNearestHorizontal(
    fromKey: Key,
    direction: 'left' | 'right',
  ): Key | null {
    const fromRect = this.getItemRect(fromKey);
    if (!fromRect) return null;

    const fromCenterX = this.getCenterX(fromRect);

    let bestKey: Key | null = null;
    let bestDistance = Infinity;

    for (const key of this.getKeys()) {
      if (key === fromKey || this.disabledKeys.has(key)) continue;

      const rect = this.getItemRect(key);
      if (!rect) continue;

      const centerX = this.getCenterX(rect);
      const isInDirection =
        direction === 'right' ? centerX > fromCenterX : centerX < fromCenterX;

      if (isInDirection && this.isOnSameRow(fromRect, rect)) {
        const distance = Math.abs(centerX - fromCenterX);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestKey = key;
        }
      }
    }

    return bestKey;
  }

  getKeyBelow(key: Key): Key | null {
    return this.findNearestVertical(key, 'down');
  }

  getKeyAbove(key: Key): Key | null {
    return this.findNearestVertical(key, 'up');
  }

  getKeyRightOf(key: Key): Key | null {
    return this.findNearestHorizontal(key, 'right');
  }

  getKeyLeftOf(key: Key): Key | null {
    return this.findNearestHorizontal(key, 'left');
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
