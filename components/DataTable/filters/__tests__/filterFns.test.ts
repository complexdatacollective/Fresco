import { type Row } from '@tanstack/react-table';
import { describe, expect, it } from 'vitest';
import {
  booleanFilterFn,
  dateFilterFn,
  facetedFilterFn,
  operatorFilterFn,
  rangeFilterFn,
} from '~/components/DataTable/filters/filterFns';

function mockRow<T>(original: T, getValue?: (id: string) => unknown): Row<T> {
  return {
    original,
    getValue: getValue ?? (() => undefined),
  } as unknown as Row<T>;
}

describe('rangeFilterFn', () => {
  it('returns true when value is within range', () => {
    const row = mockRow({}, () => 5);
    expect(rangeFilterFn(row, 'col', { min: 1, max: 10 })).toBe(true);
  });

  it('returns false when value is outside range', () => {
    const row = mockRow({}, () => 15);
    expect(rangeFilterFn(row, 'col', { min: 1, max: 10 })).toBe(false);
  });

  it('returns true when value is at boundary', () => {
    const rowMin = mockRow({}, () => 1);
    const rowMax = mockRow({}, () => 10);
    expect(rangeFilterFn(rowMin, 'col', { min: 1, max: 10 })).toBe(true);
    expect(rangeFilterFn(rowMax, 'col', { min: 1, max: 10 })).toBe(true);
  });
});

describe('dateFilterFn', () => {
  it('returns true when date is within range', () => {
    const row = mockRow({}, () => new Date('2025-06-15'));
    expect(
      dateFilterFn(row, 'col', { from: '2025-06-01', to: '2025-06-30' }),
    ).toBe(true);
  });

  it('returns false when date is outside range', () => {
    const row = mockRow({}, () => new Date('2025-07-15'));
    expect(
      dateFilterFn(row, 'col', { from: '2025-06-01', to: '2025-06-30' }),
    ).toBe(false);
  });

  it('returns true when date is at boundary (end of day)', () => {
    const row = mockRow({}, () => new Date('2025-06-30T18:00:00'));
    expect(
      dateFilterFn(row, 'col', { from: '2025-06-01', to: '2025-06-30' }),
    ).toBe(true);
  });

  it('returns false when date value is null', () => {
    const row = mockRow({}, () => null);
    expect(
      dateFilterFn(row, 'col', { from: '2025-06-01', to: '2025-06-30' }),
    ).toBe(false);
  });
});

describe('booleanFilterFn', () => {
  it('returns true when filterValue is true and value is truthy', () => {
    const row = mockRow({}, () => 'some value');
    expect(booleanFilterFn(row, 'col', true)).toBe(true);
  });

  it('returns false when filterValue is true and value is null', () => {
    const row = mockRow({}, () => null);
    expect(booleanFilterFn(row, 'col', true)).toBe(false);
  });

  it('returns true when filterValue is false and value is null', () => {
    const row = mockRow({}, () => null);
    expect(booleanFilterFn(row, 'col', false)).toBe(true);
  });

  it('returns false when filterValue is false and value is truthy', () => {
    const row = mockRow({}, () => 'some value');
    expect(booleanFilterFn(row, 'col', false)).toBe(false);
  });
});

describe('facetedFilterFn', () => {
  it('returns true when value is in the filter list', () => {
    const row = mockRow({}, () => 'active');
    expect(facetedFilterFn(row, 'col', ['active', 'pending'])).toBe(true);
  });

  it('returns false when value is not in the filter list', () => {
    const row = mockRow({}, () => 'archived');
    expect(facetedFilterFn(row, 'col', ['active', 'pending'])).toBe(false);
  });

  it('returns false when filter list is empty', () => {
    const row = mockRow({}, () => 'active');
    expect(facetedFilterFn(row, 'col', [])).toBe(false);
  });
});

describe('operatorFilterFn', () => {
  const networkData = {
    network: {
      nodes: [
        { type: 'person', count: 5 },
        { type: 'place', count: 3 },
      ],
      edges: [{ type: 'knows', count: 7 }],
    },
  };

  it('returns true when gte condition passes', () => {
    const row = mockRow(networkData);
    expect(
      operatorFilterFn(row, '', {
        conditions: [
          {
            entityType: 'person',
            entityLabel: 'person (nodes)',
            entityKind: 'nodes',
            operator: 'gte',
            value: 5,
          },
        ],
      }),
    ).toBe(true);
  });

  it('returns false when gte condition fails', () => {
    const row = mockRow(networkData);
    expect(
      operatorFilterFn(row, '', {
        conditions: [
          {
            entityType: 'person',
            entityLabel: 'person (nodes)',
            entityKind: 'nodes',
            operator: 'gte',
            value: 10,
          },
        ],
      }),
    ).toBe(false);
  });

  it('treats missing entity type as count 0', () => {
    const row = mockRow(networkData);
    expect(
      operatorFilterFn(row, '', {
        conditions: [
          {
            entityType: 'organization',
            entityLabel: 'organization (nodes)',
            entityKind: 'nodes',
            operator: 'eq',
            value: 0,
          },
        ],
      }),
    ).toBe(true);
  });

  it('applies AND logic across multiple conditions', () => {
    const row = mockRow(networkData);
    expect(
      operatorFilterFn(row, '', {
        conditions: [
          {
            entityType: 'person',
            entityLabel: 'person (nodes)',
            entityKind: 'nodes',
            operator: 'gte',
            value: 5,
          },
          {
            entityType: 'place',
            entityLabel: 'place (nodes)',
            entityKind: 'nodes',
            operator: 'gt',
            value: 10,
          },
        ],
      }),
    ).toBe(false);
  });

  it('handles eq operator', () => {
    const row = mockRow(networkData);
    expect(
      operatorFilterFn(row, '', {
        conditions: [
          {
            entityType: 'person',
            entityLabel: 'person (nodes)',
            entityKind: 'nodes',
            operator: 'eq',
            value: 5,
          },
        ],
      }),
    ).toBe(true);
  });

  it('handles gt operator', () => {
    const row = mockRow(networkData);
    expect(
      operatorFilterFn(row, '', {
        conditions: [
          {
            entityType: 'knows',
            entityLabel: 'knows (edges)',
            entityKind: 'edges',
            operator: 'gt',
            value: 6,
          },
        ],
      }),
    ).toBe(true);
  });

  it('handles lt operator', () => {
    const row = mockRow(networkData);
    expect(
      operatorFilterFn(row, '', {
        conditions: [
          {
            entityType: 'place',
            entityLabel: 'place (nodes)',
            entityKind: 'nodes',
            operator: 'lt',
            value: 5,
          },
        ],
      }),
    ).toBe(true);
  });

  it('handles lte operator', () => {
    const row = mockRow(networkData);
    expect(
      operatorFilterFn(row, '', {
        conditions: [
          {
            entityType: 'knows',
            entityLabel: 'knows (edges)',
            entityKind: 'edges',
            operator: 'lte',
            value: 7,
          },
        ],
      }),
    ).toBe(true);
  });
});
