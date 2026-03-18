'use client';

import { Check } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import {
  type FacetedFilterConfig,
  type Option,
} from '~/components/DataTable/filters/types';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '~/components/ui/command';
import { cn } from '~/utils/shadcn';

type FacetedFilterProps = {
  value: string[] | undefined;
  onChange: (value: string[] | undefined) => void;
  config: FacetedFilterConfig;
  data: unknown[];
};

export function FacetedFilter({
  value,
  onChange,
  config,
  data,
}: FacetedFilterProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState('');

  const options: Option[] = useMemo(
    () =>
      typeof config.options === 'function'
        ? config.options(data)
        : config.options,
    [config, data],
  );

  const selectedValues = useMemo(() => new Set(value ?? []), [value]);

  const toggleOption = (optionValue: string) => {
    const next = new Set(selectedValues);
    if (next.has(optionValue)) {
      next.delete(optionValue);
    } else {
      next.add(optionValue);
    }
    const arr = Array.from(next);
    onChange(arr.length > 0 ? arr : undefined);
    inputRef.current?.focus();
  };

  const selectAll = () => {
    onChange(options.map((o) => o.value));
  };

  const deselectAll = () => {
    onChange(undefined);
  };

  return (
    <Command loop>
      <CommandInput
        name="filter"
        ref={inputRef}
        placeholder="Search..."
        value={inputValue}
        onValueChange={setInputValue}
        className="my-2 h-8"
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup className="max-h-72 overflow-auto">
          <CommandItem onSelect={selectAll}>Select All</CommandItem>
          <CommandItem onSelect={deselectAll}>Deselect All</CommandItem>
          <CommandSeparator />
          {options.map((option) => {
            const isSelected = selectedValues.has(option.value);
            return (
              <CommandItem
                key={option.value}
                value={option.value}
                onSelect={() => toggleOption(option.value)}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    isSelected ? 'opacity-100' : 'opacity-0',
                  )}
                />
                <span>{option.label}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
