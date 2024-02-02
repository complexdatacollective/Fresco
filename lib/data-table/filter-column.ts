import {
  eq,
  like,
  not,
  notLike,
  type Column,
  type ColumnBaseConfig,
  type ColumnDataType,
  type SQL,
} from 'drizzle-orm';

export function filterColumn({
  column,
  value,
}: {
  column: Column<ColumnBaseConfig<ColumnDataType, string>, object, object>;
  value: string;
}): SQL<unknown> {
  const [filterValue, filterVariety] = value?.split('.') ?? [];

  switch (filterVariety) {
    case 'contains':
      return like(column, `%${filterValue}%`);
    case 'does not contain':
      return notLike(column, `%${filterValue}%`);
    case 'is':
      return eq(column, filterValue);
    case 'is not':
      return not(eq(column, filterValue));
    default:
      return like(column, `%${filterValue}%`);
  }
}
