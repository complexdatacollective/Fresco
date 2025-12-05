import { type Column } from '@tanstack/react-table';
import { Check, Plus } from 'lucide-react';
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
      {
        variant === 'popover' ? (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="dashed" icon={<Plus />}>
                {title}
                {selectedValues?.size > 0 && (
                  <>
                    <Separator orientation="vertical" className="mx-2 h-4" />
                    <Badge
                      variant="secondary"
                      className="flex aspect-square h-8 w-auto items-center justify-center"
                    >
                      {selectedValues.size}
                    </Badge>
                  </>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start">
              <Command>
                <CommandInput name="filter" placeholder={title} />
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
                                ? 'bg-selected'
                                : 'opacity-50 [&_svg]:invisible',
                            )}
                          >
                            <Check
                              className={cx('size-4')}
                              aria-hidden="true"
                            />
                          </div>
                          {option.icon && (
                            <option.icon
                              className="mr-2 size-10 text-current/70"
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
          ''
        )

        //   (<Command className="p-1">
        //     <CommandInput
        //       name="filter"
        //       placeholder={title}
        //       autoFocus
        //       className={cx(
        //         'flex w-full',
        //         'border-input bg-background rounded border',
        //         'px-3 py-1',
        //         'placeholder:text-input-placeholder text-sm',
        //         'shadow-2xs transition-colors',
        //         'file:border-0 file:bg-transparent file:text-sm file:font-medium',
        //         'disabled:cursor-not-allowed disabled:opacity-50',
        //       )}
        //     />
        //     <CommandList className="mt-1">
        //       <CommandEmpty>No results found.</CommandEmpty>
        //       <CommandGroup>
        //         {options.map((option) => {
        //           const isSelected = selectedValues.has(option.value);
        //           return (
        //             <CommandItem
        //               key={option.value}
        //               onSelect={() => {
        //                 if (isSelected) {
        //                   selectedValues.delete(option.value);
        //                 } else {
        //                   selectedValues.add(option.value);
        //                 }
        //                 const filterValues = Array.from(selectedValues);
        //                 column?.setFilterValue(
        //                   filterValues.length ? filterValues : undefined,
        //                 );
        //               }}
        //             >
        //               <div
        //                 className={cx(
        //                   'border-primary mr-2 flex size-4 items-center justify-center rounded-sm border',
        //                   isSelected
        //                     ? 'bg-primary text-primary-contrast'
        //                     : 'opacity-50 [&_svg]:invisible',
        //                 )}
        //               >
        //                 <Check className={cx('size-4')} aria-hidden="true" />
        //               </div>
        //               {option.icon && (
        //                 <option.icon
        //                   className="text-current/70 mr-2 size-4"
        //                   aria-hidden="true"
        //                 />
        //               )}
        //               <span>{option.label}</span>
        //             </CommandItem>
        //           );
        //         })}
        //       </CommandGroup>
        //       {selectedValues.size > 0 && (
        //         <>
        //           <CommandSeparator />
        //           <CommandGroup>
        //             <CommandItem
        //               onSelect={() => column?.setFilterValue(undefined)}
        //               className="justify-center text-center"
        //             >
        //               Clear filters
        //             </CommandItem>
        //           </CommandGroup>
        //         </>
        //       )}
        //     </CommandList>
        //   </Command>
        // )
      }
    </>
  );
}
