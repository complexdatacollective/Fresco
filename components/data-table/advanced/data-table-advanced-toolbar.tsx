'use client';

import type { Table } from '@tanstack/react-table';
import * as React from 'react';

import { ChevronsUpDown, Plus } from 'lucide-react';
import { DataTableAdvancedFilter } from '~/components/data-table/advanced/data-table-advanced-filter';
import type {
  DataTableFilterOption,
  DataTableFilterableColumn,
  DataTableSearchableColumn,
} from '~/components/DataTable/types';
import { Button } from '~/components/ui/Button';
import { InputField } from '~/lib/form/components/fields/Input';

type DataTableAdvancedToolbarProps<TData> = {
  dataTable: Table<TData>;
  searchableColumns?: DataTableSearchableColumn<TData>[];
  filterableColumns?: DataTableFilterableColumn<TData>[];
};

export function DataTableAdvancedToolbar<TData>({
  dataTable,
  filterableColumns = [],
  searchableColumns = [],
}: DataTableAdvancedToolbarProps<TData>) {
  const [selectedOptions, setSelectedOptions] = React.useState<
    DataTableFilterOption<TData>[]
  >([]);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (selectedOptions.length > 0) {
      setOpen(true);
    }
  }, [selectedOptions]);

  const options: DataTableFilterOption<TData>[] = React.useMemo(() => {
    const searchableOptions = searchableColumns.map((column) => ({
      id: crypto.randomUUID(),
      label: String(column.id),
      value: column.id,
      items: [],
    }));
    const filterableOptions = filterableColumns.map((column) => ({
      id: crypto.randomUUID(),
      label: column.title,
      value: column.id,
      items: column.options,
    }));

    return [...searchableOptions, ...filterableOptions];
  }, [filterableColumns, searchableColumns]);

  return (
    <>
      <div className="flex items-center justify-between space-x-2">
        <div className="flex flex-1 items-center space-x-2">
          {searchableColumns.length > 0 &&
            searchableColumns.map(
              (column) =>
                dataTable.getColumn(column.id ? String(column.id) : '') && (
                  <InputField
                    name="filter"
                    key={String(column.id)}
                    placeholder={`Filter ${column.title}...`}
                    value={
                      (dataTable
                        .getColumn(String(column.id))
                        ?.getFilterValue() as string) ?? ''
                    }
                    onChange={(event) =>
                      dataTable
                        .getColumn(String(column.id))
                        ?.setFilterValue(event.target.value)
                    }
                    className="laptop:w-[250px] mt-0 h-8 w-[150px]"
                  />
                ),
            )}
        </div>
        <div className="flex items-center space-x-2">
          {selectedOptions.length > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen((prev) => !prev)}
            >
              Filter
              <ChevronsUpDown
                className="ml-2 size-4 opacity-50"
                aria-hidden="true"
              />
            </Button>
          ) : (
            <DataTableAdvancedFilter
              options={options.filter(
                (option) =>
                  !selectedOptions.some(
                    (selectedOption) => selectedOption.value === option.value,
                  ),
              )}
              selectedOptions={selectedOptions}
              setSelectedOptions={setSelectedOptions}
            />
          )}
          {/* <DataTableViewOptions table={dataTable} /> */}
        </div>
      </div>
      {open ? (
        <div className="flex items-center space-x-2">
          <DataTableAdvancedFilter
            options={options}
            selectedOptions={selectedOptions}
            setSelectedOptions={setSelectedOptions}
          >
            <Button
              variant="outline"
              size="sm"
              role="combobox"
              className="rounded-full"
            >
              <Plus className="mr-2 size-4 opacity-50" aria-hidden="true" />
              Add filter
            </Button>
          </DataTableAdvancedFilter>
        </div>
      ) : null}
    </>
  );
}
