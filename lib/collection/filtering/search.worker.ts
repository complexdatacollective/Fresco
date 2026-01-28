/**
 * Web Worker for fuzzy search using fuse.js.
 * Uses Comlink for clean RPC-style communication.
 */

import { expose } from 'comlink';
import Fuse, { type IFuseOptions } from 'fuse.js';

type SearchableItem = Record<string, unknown> & { _key: string };

class SearchEngine {
  private fuse: Fuse<SearchableItem> | null = null;
  private items: SearchableItem[] = [];

  /**
   * Initialize the search index with items and configuration.
   * Called when items or configuration change.
   */
  init(
    items: SearchableItem[],
    keys: string[],
    options: IFuseOptions<SearchableItem> = {},
  ): void {
    this.items = items;
    this.fuse = new Fuse(items, {
      keys,
      includeScore: true,
      threshold: 0.4,
      distance: 100,
      ignoreLocation: true,
      minMatchCharLength: 1,
      findAllMatches: true,
      ...options,
    });
  }

  /**
   * Perform a search and return matching keys with scores.
   */
  search(
    query: string,
    minQueryLength = 1,
  ): {
    matchingKeys: string[];
    matchCount: number;
    scores: [string, number][];
  } {
    if (!this.fuse || query.length < minQueryLength) {
      // No filter - return all items
      return {
        matchingKeys: this.items.map((item) => item._key),
        matchCount: this.items.length,
        scores: [],
      };
    }

    const results = this.fuse.search(query);
    const matchingKeys: string[] = [];
    const scores: [string, number][] = [];

    for (const result of results) {
      matchingKeys.push(result.item._key);
      if (result.score !== undefined) {
        scores.push([result.item._key, result.score]);
      }
    }

    return {
      matchingKeys,
      matchCount: matchingKeys.length,
      scores,
    };
  }

  /**
   * Update items without changing configuration.
   */
  updateItems(items: SearchableItem[]): void {
    if (this.fuse) {
      this.items = items;
      this.fuse.setCollection(items);
    }
  }

  /**
   * Check if index is initialized.
   */
  isReady(): boolean {
    return this.fuse !== null;
  }
}

expose(new SearchEngine());
