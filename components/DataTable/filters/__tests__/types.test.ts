import { describe, expect, it } from 'vitest';
import { ColumnFiltersStateSchema } from '~/components/DataTable/filters/types';

describe('ColumnFiltersStateSchema', () => {
  it('accepts an empty array', () => {
    const result = ColumnFiltersStateSchema.safeParse([]);
    expect(result.success).toBe(true);
  });

  it('accepts a range filter value', () => {
    const result = ColumnFiltersStateSchema.safeParse([
      { id: 'networkSize', value: { min: 0, max: 10 } },
    ]);
    expect(result.success).toBe(true);
  });

  it('accepts a boolean filter value', () => {
    const result = ColumnFiltersStateSchema.safeParse([
      { id: 'finished', value: true },
    ]);
    expect(result.success).toBe(true);
  });

  it('accepts an operator filter value', () => {
    const result = ColumnFiltersStateSchema.safeParse([
      {
        id: 'degree',
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
    ]);
    expect(result.success).toBe(true);
  });

  it('accepts multiple filters', () => {
    const result = ColumnFiltersStateSchema.safeParse([
      { id: 'networkSize', value: { min: 0, max: 10 } },
      { id: 'finished', value: true },
      { id: 'protocol', value: ['abc', 'def'] },
    ]);
    expect(result.success).toBe(true);
  });

  it('rejects a non-array', () => {
    const result = ColumnFiltersStateSchema.safeParse('not-an-array');
    expect(result.success).toBe(false);
  });

  it('rejects entries without id', () => {
    const result = ColumnFiltersStateSchema.safeParse([
      { value: { min: 0, max: 10 } },
    ]);
    expect(result.success).toBe(false);
  });
});
