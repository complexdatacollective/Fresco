import { describe, expect, it } from 'vitest';
import { ColumnFiltersStateSchema } from '~/components/DataTable/filters/types';

describe('ColumnFiltersStateSchema', () => {
  it('accepts an empty array', () => {
    expect(ColumnFiltersStateSchema.parse([])).toEqual([]);
  });

  it('accepts valid range filter', () => {
    const input = [{ id: 'progress', value: { min: 0, max: 100 } }];
    expect(ColumnFiltersStateSchema.parse(input)).toEqual(input);
  });

  it('accepts valid boolean filter', () => {
    const input = [{ id: 'exportTime', value: true }];
    expect(ColumnFiltersStateSchema.parse(input)).toEqual(input);
  });

  it('accepts valid operator filter', () => {
    const input = [
      {
        id: 'network',
        value: {
          conditions: [
            {
              entityType: 'person',
              entityKind: 'nodes',
              operator: 'gte',
              value: 3,
            },
          ],
        },
      },
    ];
    expect(ColumnFiltersStateSchema.parse(input)).toEqual(input);
  });

  it('accepts multiple filters', () => {
    const input = [
      { id: 'progress', value: { min: 50, max: 100 } },
      { id: 'exportTime', value: false },
    ];
    expect(ColumnFiltersStateSchema.parse(input)).toEqual(input);
  });

  it('rejects non-array input', () => {
    expect(() => ColumnFiltersStateSchema.parse('invalid')).toThrow();
  });

  it('rejects entries without id', () => {
    expect(() => ColumnFiltersStateSchema.parse([{ value: true }])).toThrow();
  });
});
