import { type Column } from '@tanstack/react-table';
import { Check, PlusCircle } from 'lucide-react';
import { getBadgeColorsForActivityType } from '~/app/dashboard/_components/ActivityFeed/utils';
import { type Option } from '~/components/DataTable/types';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/Button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '~/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover';
import { Separator } from '~/components/ui/separator';
import { cx } from '~/utils/cva';

type DataTableFacetedFilter<TData, TValue> = {
  column?: Column<TData, TValue>;
  title?: string;
  options: Option[];
  variant?: 'popover' | 'command';
};

export function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options,
  variant = 'popover',
}: DataTableFacetedFilter<TData, TValue>) {
  const selectedValues = new Set(column?.getFilterValue() as string[]);

  return (
    <>
      {variant === 'popover' ? (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-10 border-dashed">
              <PlusCircle className="mr-2" size={16} />
              {title}
              {selectedValues?.size > 0 && (
                <>
                  <Separator orientation="vertical" className="mx-2 h-4" />
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 lg:hidden"
                  >
                    {selectedValues.size}
                  </Badge>
                  <div className="hidden space-x-1 lg:flex">
                    {selectedValues.size > 2 ? (
                      <Badge>{selectedValues.size} selected</Badge>
                    ) : (
                      options
                        .filter((option) => selectedValues.has(option.value))
                        .map((option) => (
                          <Badge
                            variant="secondary"
                            key={option.value}
                            className={getBadgeColorsForActivityType(
                              option.value,
                            )}
                          >
                            {option.label}
                          </Badge>
                        ))
                    )}
                  </div>
                </>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0" align="start">
            <Command>
              <CommandInput
                name="filter"
                placeholder={title}
                className="my-2 h-8"
              />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup>
                  {options.map((option) => {
                    const isSelected = selectedValues.has(option.value);
                    return (
                      <CommandItem
                        key={option.value}
                        onSelect={() => {
                          if (isSelected) {
                            selectedValues.delete(option.value);
                          } else {
                            selectedValues.add(option.value);
                          }
                          const filterValues = Array.from(selectedValues);
                          column?.setFilterValue(
                            filterValues.length ? filterValues : undefined,
                          );
                        }}
                      >
                        <div
                          className={cx(
                            'border-primary mr-2 flex size-4 items-center justify-center rounded-sm border',
                            isSelected
                              ? 'bg-primary text-primary-contrast'
                              : 'opacity-50 [&_svg]:invisible',
                          )}
                        >
                          <Check className={cx('size-4')} aria-hidden="true" />
                        </div>
                        {option.icon && (
                          <option.icon
                            className="text-muted-contrast mr-2 size-4"
                            aria-hidden="true"
                          />
                        )}
                        <span>{option.label}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
                {selectedValues.size > 0 && (
                  <>
                    <CommandSeparator />
                    <CommandGroup>
                      <CommandItem
                        onSelect={() => column?.setFilterValue(undefined)}
                        className="justify-center text-center"
                      >
                        Clear filters
                      </CommandItem>
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      ) : (
        <Command className="p-1">
          <CommandInput
            name="filter"
            placeholder={title}
            autoFocus
            className="focus-visible:ring-ring border-input bg-background placeholder:text-muted-contrast flex w-full rounded border px-3 py-1 text-sm shadow-2xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-1 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
          />
          <CommandList className="mt-1">
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedValues.has(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => {
                      if (isSelected) {
                        selectedValues.delete(option.value);
                      } else {
                        selectedValues.add(option.value);
                      }
                      const filterValues = Array.from(selectedValues);
                      column?.setFilterValue(
                        filterValues.length ? filterValues : undefined,
                      );
                    }}
                  >
                    <div
                      className={cx(
                        'border-primary mr-2 flex size-4 items-center justify-center rounded-sm border',
                        isSelected
                          ? 'bg-primary text-primary-contrast'
                          : 'opacity-50 [&_svg]:invisible',
                      )}
                    >
                      <Check className={cx('size-4')} aria-hidden="true" />
                    </div>
                    {option.icon && (
                      <option.icon
                        className="text-muted-contrast mr-2 size-4"
                        aria-hidden="true"
                      />
                    )}
                    <span>{option.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {selectedValues.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => column?.setFilterValue(undefined)}
                    className="justify-center text-center"
                  >
                    Clear filters
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      )}
    </>
  );
}
