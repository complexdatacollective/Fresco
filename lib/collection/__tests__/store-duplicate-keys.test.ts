import { describe, expect, it } from 'vitest';
import { createCollectionStore } from '../store';
import { type Key } from '../types';

type TestItem = Record<string, unknown> & {
  id: string;
  name: string;
};

const keyExtractor = (item: TestItem): Key => item.id;
const textValueExtractor = (item: TestItem) => item.name;

describe('store duplicate key handling', () => {
  it('should not produce duplicate entries in orderedKeys when items share the same key', () => {
    const store = createCollectionStore<TestItem>();

    // Simulate external data where some rows are identical and produce
    // the same key (e.g. roster CSV with duplicate students).
    const items: TestItem[] = [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
      { id: '2', name: 'Bob' }, // duplicate key
      { id: '3', name: 'Charlie' },
      { id: '3', name: 'Charlie' }, // duplicate key
      { id: '4', name: 'Dave' },
    ];

    store.getState().setItems(items, keyExtractor, textValueExtractor);

    const state = store.getState();

    // orderedKeys length must equal the number of unique keys (items Map size).
    // If orderedKeys contains duplicates, measurement in useMeasureItems will
    // never complete because Map-based measurement count < orderedKeys.length.
    expect(state.orderedKeys).toHaveLength(state.items.size);
    expect(state.orderedKeys).toEqual(['1', '2', '3', '4']);
    expect(state.size).toBe(4);
  });

  it('should handle duplicates correctly after resortItems', () => {
    const store = createCollectionStore<TestItem>();

    const items: TestItem[] = [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
      { id: '2', name: 'Bob' }, // duplicate
    ];

    store.getState().setItems(items, keyExtractor, textValueExtractor);
    store.getState().resortItems();

    const state = store.getState();
    expect(state.orderedKeys).toHaveLength(state.items.size);
    expect(state.size).toBe(2);
  });
});
