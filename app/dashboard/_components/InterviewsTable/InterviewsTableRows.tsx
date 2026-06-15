import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type OnChangeFn,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
} from '@tanstack/react-table';
import { type OperatorCondition } from '@codaco/fresco-ui/DataTable/filters/types';
import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsInteger,
  parseAsJson,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from 'nuqs';
import { use, useMemo, type ReactNode } from 'react';
import superjson from 'superjson';
import { z } from 'zod/mini';
import { DataTable } from '@codaco/fresco-ui/DataTable/DataTable';
import { useNuqsTable } from '~/components/DataTable/nuqs/NuqsTableProvider';
import type {
  GetInterviewsQuery,
  GetInterviewsReturnType,
} from '~/queries/interviews';
import { InterviewsSelectionBar } from './InterviewsSelectionBar';
import { searchParamsUrlKeys, sortableFields, sortOrder } from './searchParams';

type InterviewRow = GetInterviewsQuery[number];

// Mirror of searchParams.ts's networkConditionSchema, with `entityLabel` added
// so the parsed value is a valid fresco-ui OperatorCondition for the popover.
// The server schema strips `entityLabel`, so writing it back to the URL is safe.
const networkConditionSchema = z.array(
  z.object({
    entityKind: z.enum(['nodes', 'edges']),
    entityType: z.string(),
    entityLabel: z.optional(z.string()),
    operator: z.enum(['eq', 'gt', 'lt', 'gte', 'lte']),
    value: z.number(),
  }),
);

const parseRange = (raw: string): { from: string; to: string } | null => {
  const [from, to] = raw.split('..');
  if (from === undefined || to === undefined) return null;
  return { from, to };
};

const parseNumericRange = (
  raw: string,
): { min: number; max: number } | null => {
  const [minRaw, maxRaw] = raw.split('..');
  if (minRaw === undefined || maxRaw === undefined) return null;
  const min = Number(minRaw);
  const max = Number(maxRaw);
  if (Number.isNaN(min) || Number.isNaN(max)) return null;
  return { min, max };
};

const isStringRange = (v: unknown): v is { from: string; to: string } =>
  typeof v === 'object' &&
  v !== null &&
  'from' in v &&
  'to' in v &&
  typeof v.from === 'string' &&
  typeof v.to === 'string';

const isNumericRange = (v: unknown): v is { min: number; max: number } =>
  typeof v === 'object' &&
  v !== null &&
  'min' in v &&
  'max' in v &&
  typeof v.min === 'number' &&
  typeof v.max === 'number';

const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((item) => typeof item === 'string');

const isOperatorValue = (
  v: unknown,
): v is { conditions: OperatorCondition[] } =>
  typeof v === 'object' &&
  v !== null &&
  'conditions' in v &&
  Array.isArray(v.conditions);

export default function InterviewsTableRows({
  interviewsPromise,
  rowSelection,
  onRowSelectionChange,
  columns,
  toolbar,
  isBusy,
  onDeleteSelected,
  onExportSelected,
  onSelectAllMatching,
  onDeselectAll,
}: {
  interviewsPromise: GetInterviewsReturnType;
  rowSelection: RowSelectionState;
  onRowSelectionChange: OnChangeFn<RowSelectionState>;
  columns: ColumnDef<InterviewRow, unknown>[];
  toolbar: ReactNode;
  isBusy: boolean;
  onDeleteSelected: () => void;
  onExportSelected: () => void;
  onSelectAllMatching: () => void;
  onDeselectAll: () => void;
}) {
  // TanStack Table returns a mutable ref with stable identity, defeating React Compiler memoization.
  'use no memo';
  const data = use(interviewsPromise);
  const rows = useMemo(
    () => superjson.parse<GetInterviewsQuery>(data.rows),
    [data.rows],
  );
  const { startTransition } = useNuqsTable();

  // Pagination, sort, and every filter param are read here so the header
  // popovers can hydrate from the URL. Filtering still runs server-side, so the
  // table is in manual mode and translates column filters back to the URL.
  const [params, setTableState] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      perPage: parseAsInteger.withDefault(10),
      sort: parseAsStringLiteral(sortOrder).withDefault('none'),
      sortField:
        parseAsStringLiteral(sortableFields).withDefault('lastUpdated'),
      protocol: parseAsArrayOf(parseAsString),
      started: parseAsString,
      updated: parseAsString,
      progress: parseAsString,
      exported: parseAsBoolean,
      network: parseAsJson((v) => networkConditionSchema.parse(v)),
    },
    {
      urlKeys: searchParamsUrlKeys,
      shallow: false,
      clearOnDefault: true,
      startTransition,
    },
  );

  const { page, perPage, sort, sortField } = params;

  const pagination: PaginationState = {
    pageIndex: page - 1,
    pageSize: perPage,
  };

  const sorting: SortingState =
    sort === 'none' ? [] : [{ id: sortField, desc: sort === 'desc' }];

  const columnFilters: ColumnFiltersState = useMemo(() => {
    const filters: ColumnFiltersState = [];
    if (params.protocol) {
      filters.push({ id: 'protocolName', value: params.protocol });
    }
    if (params.started) {
      const range = parseRange(params.started);
      if (range) filters.push({ id: 'startTime', value: range });
    }
    if (params.updated) {
      const range = parseRange(params.updated);
      if (range) filters.push({ id: 'lastUpdated', value: range });
    }
    if (params.progress) {
      const range = parseNumericRange(params.progress);
      if (range) filters.push({ id: 'progress', value: range });
    }
    if (params.network) {
      const conditions: OperatorCondition[] = params.network.map((c) => ({
        entityKind: c.entityKind,
        entityType: c.entityType,
        entityLabel: c.entityLabel ?? c.entityType,
        operator: c.operator,
        value: c.value,
      }));
      filters.push({ id: 'network', value: { conditions } });
    }
    if (params.exported !== null) {
      filters.push({ id: 'exportTime', value: params.exported });
    }
    return filters;
  }, [
    params.protocol,
    params.started,
    params.updated,
    params.progress,
    params.network,
    params.exported,
  ]);

  const onColumnFiltersChange: OnChangeFn<ColumnFiltersState> = (updater) => {
    const next =
      typeof updater === 'function' ? updater(columnFilters) : updater;
    const byId = new Map(next.map((f) => [f.id, f.value]));

    const protocol = byId.get('protocolName');
    const startTime = byId.get('startTime');
    const lastUpdated = byId.get('lastUpdated');
    const progress = byId.get('progress');
    const network = byId.get('network');
    const exportTime = byId.get('exportTime');

    void setTableState({
      page: 1,
      protocol: isStringArray(protocol) ? protocol : null,
      started: isStringRange(startTime)
        ? `${startTime.from}..${startTime.to}`
        : null,
      updated: isStringRange(lastUpdated)
        ? `${lastUpdated.from}..${lastUpdated.to}`
        : null,
      progress: isNumericRange(progress)
        ? `${String(progress.min)}..${String(progress.max)}`
        : null,
      network: isOperatorValue(network) ? network.conditions : null,
      exported: typeof exportTime === 'boolean' ? exportTime : null,
    });
  };

  const table = useReactTable({
    data: rows,
    columns,
    pageCount: data.pageCount,
    getRowId: (row) => row.id,
    state: { pagination, sorting, rowSelection, columnFilters },
    onPaginationChange: (updater) => {
      const next =
        typeof updater === 'function' ? updater(pagination) : updater;
      void setTableState({
        page: next.pageIndex + 1,
        perPage: next.pageSize,
      });
    },
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater;
      const first = next[0];
      if (!first) {
        void setTableState({ sort: null, sortField: null });
        return;
      }
      const field = sortableFields.find((f) => f === first.id);
      if (!field) return;
      void setTableState({
        sort: first.desc ? 'desc' : 'asc',
        sortField: field,
      });
    },
    onColumnFiltersChange,
    onRowSelectionChange,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  });

  const selectedCount = Object.keys(rowSelection).filter(
    (id) => rowSelection[id],
  ).length;

  return (
    <>
      <DataTable table={table} toolbar={toolbar} />
      <InterviewsSelectionBar
        selectedCount={selectedCount}
        totalCount={data.totalCount}
        isBusy={isBusy}
        onSelectAllMatching={onSelectAllMatching}
        onDeselectAll={onDeselectAll}
        onDeleteSelected={onDeleteSelected}
        onExportSelected={onExportSelected}
      />
    </>
  );
}
