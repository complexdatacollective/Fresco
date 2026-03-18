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
  it('includes values within range', () => {
    const row = mockRow({}, () => 50);
    expect(rangeFilterFn(row, 'progress', { min: 0, max: 100 })).toBe(true);
  });

  it('includes boundary values', () => {
    const rowMin = mockRow({}, () => 0);
    const rowMax = mockRow({}, () => 100);
    expect(rangeFilterFn(rowMin, 'progress', { min: 0, max: 100 })).toBe(true);
    expect(rangeFilterFn(rowMax, 'progress', { min: 0, max: 100 })).toBe(true);
  });

  it('excludes values outside range', () => {
    const row = mockRow({}, () => 150);
    expect(rangeFilterFn(row, 'progress', { min: 0, max: 100 })).toBe(false);
  });
});

describe('dateFilterFn', () => {
  it('includes dates within range', () => {
    const row = mockRow({}, () => new Date('2025-06-15'));
    expect(
      dateFilterFn(row, 'createdAt', { from: '2025-06-01', to: '2025-06-30' }),
    ).toBe(true);
  });

  it('excludes dates outside range', () => {
    const row = mockRow({}, () => new Date('2025-07-15'));
    expect(
      dateFilterFn(row, 'createdAt', { from: '2025-06-01', to: '2025-06-30' }),
    ).toBe(false);
  });

  it('includes boundary dates (inclusive)', () => {
    const rowFrom = mockRow({}, () => new Date('2025-06-01'));
    const rowTo = mockRow({}, () => new Date('2025-06-30T23:59:59.999'));
    expect(
      dateFilterFn(rowFrom, 'createdAt', {
        from: '2025-06-01',
        to: '2025-06-30',
      }),
    ).toBe(true);
    expect(
      dateFilterFn(rowTo, 'createdAt', {
        from: '2025-06-01',
        to: '2025-06-30',
      }),
    ).toBe(true);
  });
});

describe('booleanFilterFn', () => {
  it('true includes truthy values', () => {
    const row = mockRow({}, () => new Date());
    expect(booleanFilterFn(row, 'exportTime', true)).toBe(true);
  });

  it('true excludes null values', () => {
    const row = mockRow({}, () => null);
    expect(booleanFilterFn(row, 'exportTime', true)).toBe(false);
  });

  it('false includes null values', () => {
    const row = mockRow({}, () => null);
    expect(booleanFilterFn(row, 'exportTime', false)).toBe(true);
  });

  it('false excludes truthy values', () => {
    const row = mockRow({}, () => new Date());
    expect(booleanFilterFn(row, 'exportTime', false)).toBe(false);
  });
});

describe('facetedFilterFn', () => {
  it('includes when value is in array', () => {
    const row = mockRow({}, () => 'active');
    expect(facetedFilterFn(row, 'status', ['active', 'pending'])).toBe(true);
  });

  it('excludes when value is not in array', () => {
    const row = mockRow({}, () => 'archived');
    expect(facetedFilterFn(row, 'status', ['active', 'pending'])).toBe(false);
  });

  it('excludes on empty array', () => {
    const row = mockRow({}, () => 'active');
    expect(facetedFilterFn(row, 'status', [])).toBe(false);
  });
});

type NetworkData = {
  network: {
    nodes: { type: string; count: number }[];
    edges: { type: string; count: number }[];
  };
};

describe('operatorFilterFn', () => {
  const data: NetworkData = {
    network: {
      nodes: [
        { type: 'person', count: 5 },
        { type: 'place', count: 3 },
      ],
      edges: [{ type: 'knows', count: 7 }],
    },
  };

  it('gte passes when count meets threshold', () => {
    const row = mockRow(data);
    expect(
      operatorFilterFn(row, 'network', {
        conditions: [
          {
            entityType: 'person',
            entityKind: 'nodes',
            operator: 'gte',
            value: 5,
          },
        ],
      }),
    ).toBe(true);
  });

  it('gte fails when count is below threshold', () => {
    const row = mockRow(data);
    expect(
      operatorFilterFn(row, 'network', {
        conditions: [
          {
            entityType: 'person',
            entityKind: 'nodes',
            operator: 'gte',
            value: 10,
          },
        ],
      }),
    ).toBe(false);
  });

  it('treats missing entity type as count 0', () => {
    const row = mockRow(data);
    expect(
      operatorFilterFn(row, 'network', {
        conditions: [
          {
            entityType: 'unknown',
            entityKind: 'nodes',
            operator: 'eq',
            value: 0,
          },
        ],
      }),
    ).toBe(true);
  });

  it('multiple AND conditions all must pass', () => {
    const row = mockRow(data);
    expect(
      operatorFilterFn(row, 'network', {
        conditions: [
          {
            entityType: 'person',
            entityKind: 'nodes',
            operator: 'gte',
            value: 5,
          },
          {
            entityType: 'knows',
            entityKind: 'edges',
            operator: 'gt',
            value: 3,
          },
        ],
      }),
    ).toBe(true);

    expect(
      operatorFilterFn(row, 'network', {
        conditions: [
          {
            entityType: 'person',
            entityKind: 'nodes',
            operator: 'gte',
            value: 5,
          },
          {
            entityType: 'knows',
            entityKind: 'edges',
            operator: 'gt',
            value: 10,
          },
        ],
      }),
    ).toBe(false);
  });

  it('supports all 5 operators', () => {
    const row = mockRow(data);

    // person count is 5
    expect(
      operatorFilterFn(row, 'network', {
        conditions: [
          {
            entityType: 'person',
            entityKind: 'nodes',
            operator: 'eq',
            value: 5,
          },
        ],
      }),
    ).toBe(true);

    expect(
      operatorFilterFn(row, 'network', {
        conditions: [
          {
            entityType: 'person',
            entityKind: 'nodes',
            operator: 'gt',
            value: 4,
          },
        ],
      }),
    ).toBe(true);

    expect(
      operatorFilterFn(row, 'network', {
        conditions: [
          {
            entityType: 'person',
            entityKind: 'nodes',
            operator: 'lt',
            value: 6,
          },
        ],
      }),
    ).toBe(true);

    expect(
      operatorFilterFn(row, 'network', {
        conditions: [
          {
            entityType: 'person',
            entityKind: 'nodes',
            operator: 'gte',
            value: 5,
          },
        ],
      }),
    ).toBe(true);

    expect(
      operatorFilterFn(row, 'network', {
        conditions: [
          {
            entityType: 'person',
            entityKind: 'nodes',
            operator: 'lte',
            value: 5,
          },
        ],
      }),
    ).toBe(true);
  });
});
